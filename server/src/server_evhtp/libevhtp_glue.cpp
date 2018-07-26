#include "libevhtp_glue.hpp"

#include "../log.hpp"

#include <stdint.h>
#include <stddef.h>

namespace msrv {
namespace server_evhtp {

namespace {

class BodyFormatter : public boost::static_visitor<bool>
{
public:
    BodyFormatter(Evbuffer* buffer)
        : buffer_(buffer) { }

    bool operator()(bool) const
    {
        return false;
    }

    bool operator()(std::string& str) const
    {
        if (str.empty())
            return false;

        buffer_->write(str);
        return true;
    }

    bool operator()(std::vector<uint8_t>& buffer) const
    {
        if (buffer.empty())
            return false;

        buffer_->write(reinterpret_cast<const char*>(buffer.data()), buffer.size());
        return true;
    }

    bool operator()(ResponseCore::FileBody& file) const
    {
        if (file.size == 0)
            return false;

        buffer_->writeFile(std::move(file.handle), 0, file.size);
        return true;
    }

private:
    Evbuffer* buffer_;
};

}

EvhtpHost::EvhtpHost(EventBase* base)
    : base_(base), ptr_(nullptr), isBound_(false)
{
    ptr_ = ::evhtp_new(base->ptr(), nullptr);
    throwIfFailed("evhtp_new", ptr_ != nullptr);
    ::evhtp_set_gencb(ptr_, handleRequestReady, this);
}

EvhtpHost::~EvhtpHost()
{
    unbind();

    if (ptr_)
        ::evhtp_free(ptr_);
}

bool EvhtpHost::bind(const char* address, int port, int backlog)
{
    unbind();

    isBound_ = ::evhtp_bind_socket(ptr_, address, port, backlog) == 0;

    if (isBound_)
    {
        logInfo("listening on [%s]:%d", address, port);
    }
    else
    {
        logError(
            "failed to bind to address [%s]:%d: %s",
            address,
            port,
            formatError(errno).c_str());
    }

    return isBound_;
}

void EvhtpHost::unbind()
{
    if (isBound_)
    {
        ::evhtp_unbind_socket(ptr_);
        isBound_ = false;
    }
}

void EvhtpHost::handleRequestReady(evhtp_request_t* req, void* thisPtr) noexcept
{
    auto thisObj = reinterpret_cast<EvhtpHost*>(thisPtr);

    if (thisObj->listener_)
    {
        tryCatchLog([thisObj, req]
        {
            thisObj->listener_->onRequestReady(new EvhtpRequest(thisObj, req));
        });
    }
}

void EvhtpHost::notifyDone(EvhtpRequest* request)
{
    if (listener_)
        tryCatchLog([this, request] { listener_->onRequestDone(request); });
}

void EvhtpKeyValueMap::set(const std::string& key, const std::string& value)
{
    auto newPair = evhtp_kv_new(key.c_str(), value.c_str(), 1, 1);

    throwIfFailed("evhtp_kv_new", newPair != nullptr);

    auto existingPair = evhtp_kvs_find_kv(ptr(), key.c_str());

    if (existingPair)
        evhtp_kv_rm_and_free(ptr(), existingPair);

    evhtp_kvs_add_kv(ptr(), newPair);
}

EvhtpRequest::EvhtpRequest(EvhtpHost* host, evhtp_request_s* req)
    : host_(host),
      ptr_(req),
      queryParams_(req->uri->query),
      inputHeaders_(req->headers_in),
      outputHeaders_(req->headers_out),
      inputBuffer_(req->buffer_in, false),
      outputBuffer_(req->buffer_out, false)
{
    auto ret = ::evhtp_set_hook(
        &req->hooks,
        evhtp_hook_on_request_fini,
        reinterpret_cast<evhtp_hook>(static_cast<evhtp_hook_request_fini_cb>(handleDestroy)),
        this);

    throwIfFailed("evhtp_set_hook", ret >= 0);
}

EvhtpRequest::~EvhtpRequest() = default;

HttpMethod EvhtpRequest::method()
{
    switch (ptr_->method)
    {
    case htp_method_GET:
        return HttpMethod::GET;
    case htp_method_POST:
        return HttpMethod::POST;
    default:
        return HttpMethod::UNDEFINED;
    }
}

std::string EvhtpRequest::path()
{
    return ptr_->uri->path->full;
}

HttpKeyValueMap EvhtpRequest::headers()
{
    return inputHeaders_.toMap<HttpKeyValueMap>();
}

HttpKeyValueMap EvhtpRequest::queryParams()
{
    return queryParams_.toMap<HttpKeyValueMap>();
}

StringView EvhtpRequest::body()
{
    if (!body_)
        body_ = inputBuffer_.readToEnd();

    auto& body = body_.get();
    return StringView(body.data(), body.size());
}

void EvhtpRequest::releaseResources()
{
    body_ = boost::none;
}

void EvhtpRequest::abort()
{
    if (auto conn = ::evhtp_request_get_connection(ptr_))
        ::evhtp_connection_free(conn);
}

void EvhtpRequest::sendResponse(ResponseCorePtr response)
{
    outputHeaders_.fromMap(response->headers);
    writeBody(std::move(response->body), &outputBuffer_);
    ::evhtp_send_reply(ptr_, static_cast<evhtp_res>(response->status));
}

void EvhtpRequest::sendResponseBegin(ResponseCorePtr response)
{
    outputHeaders_.fromMap(response->headers);
    ::evhtp_send_reply_start(ptr_, static_cast<evhtp_res>(response->status));
    sendResponseBody(std::move(response->body));
}

void EvhtpRequest::sendResponseEnd()
{
    ::evhtp_send_reply_end(ptr_);
}

void EvhtpRequest::sendResponseBody(ResponseCore::Body body)
{
    if (writeBody(std::move(body), &tempBuffer_))
        ::evhtp_send_reply_body(ptr_, tempBuffer_.ptr());
}

uint16_t EvhtpRequest::handleDestroy(evhtp_request_s*, void* thisPtr) noexcept
{
    auto thisObj = reinterpret_cast<EvhtpRequest*>(thisPtr);
    thisObj->host_->notifyDone(thisObj);
    delete thisObj;
    return 0;
}

bool EvhtpRequest::writeBody(ResponseCore::Body body, Evbuffer* buffer)
{
    return boost::apply_visitor(BodyFormatter(buffer), body);
}

}}
