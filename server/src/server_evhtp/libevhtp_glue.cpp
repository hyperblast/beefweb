#include "libevhtp_glue.hpp"

#include "../log.hpp"

#include <stdint.h>
#include <stddef.h>

namespace msrv {
namespace server_evhtp {

EvhtpHost::EvhtpHost(EventBase* base)
    : base_(base), ptr_(nullptr), isBound_(false)
{
    ptr_ = ::evhtp_new(base->ptr(), nullptr);
    throwIfFailed("evhtp_new", ptr_ != nullptr);
    ::evhtp_set_gencb(ptr(), handleNewRequest, this);
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

    isBound_ = ::evhtp_bind_socket(ptr(), address, port, backlog) == 0;

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
        ::evhtp_unbind_socket(ptr());
        isBound_ = false;
    }
}

void EvhtpHost::handleNewRequest(evhtp_request_t* req, void* thisPtr)
{
    auto thisObj = reinterpret_cast<EvhtpHost*>(thisPtr);

    if (thisObj->requestCallback_)
        tryCatchLog([&]{ thisObj->requestCallback_(new EvhtpRequest(thisObj, req)); });
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

EvhtpRequest::~EvhtpRequest()
{
}

void EvhtpRequest::abort()
{
    auto connection = ::evhtp_request_get_connection(ptr());

    if (connection)
        ::evhtp_connection_free(connection);
}

uint16_t EvhtpRequest::handleDestroy(evhtp_request_s*, void* thisPtr) noexcept
{
    auto thisObj = reinterpret_cast<EvhtpRequest*>(thisPtr);

    if (thisObj->destroyCallback_)
        tryCatchLog([&]{ thisObj->destroyCallback_(thisObj); });

    tryCatchLog([&]{ delete thisObj; });
    return 0;
}

}}
