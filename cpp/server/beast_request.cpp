#include "beast_request.hpp"
#include "beast_connection.hpp"
#include "http.hpp"

namespace msrv {

namespace {

inline beast::http::status convertStatusCode(HttpStatus status)
{
    return beast::http::int_to_status(static_cast<unsigned>(status));
}

template<typename Response>
void convertHeaders(ResponseCore* from, Response* to)
{
    for (auto& header : from->headers)
        to->set(header.first, header.second);
}

class ResponseCoreSender : public boost::static_visitor<std::shared_ptr<void>>
{
public:
    ResponseCoreSender(
        BeastConnection* connection,
        beast::http::request<beast::http::string_body>* request,
        ResponseCore* coreResponse)
        : connection_(connection),
          request_(request),
          coreResponse_(coreResponse) { }

    std::shared_ptr<void> send() const
    {
        return boost::apply_visitor(*this, coreResponse_->body);
    }

    std::shared_ptr<void> operator()(bool) const
    {
        return sendEmpty();
    }

    std::shared_ptr<void> operator()(std::string& str) const
    {
        if (str.empty())
            return sendEmpty();

        auto resp = createResponse<beast::http::string_body>();
        resp->body() = std::move(str);
        return doSend(std::move(resp));
    }

    std::shared_ptr<void> operator()(std::vector<uint8_t>& buffer) const
    {
        if (buffer.empty())
            return sendEmpty();

        auto resp = createResponse<beast::http::vector_body<uint8_t>>();
        resp->body() = std::move(buffer);
        return doSend(std::move(resp));
    }

    std::shared_ptr<void> operator()(ResponseCore::FileBody& fileResponse) const
    {
        if (fileResponse.size == 0)
            return sendEmpty();

        auto resp = createResponse<beast::http::file_body>();

        beast::file file;
        file.native_handle(fileResponse.handle.release());

        boost::system::error_code error;
        resp->body().reset(std::move(file), error);

        return doSend(std::move(resp));
    }

private:
    std::shared_ptr<void> sendEmpty() const
    {
        return doSend(createResponse<beast::http::empty_body>());
    }

    template<typename Body>
    std::shared_ptr<beast::http::response<Body>> createResponse() const
    {
        auto resp = std::make_shared<beast::http::response<Body>>(
            convertStatusCode(coreResponse_->status), request_->version());

        resp->keep_alive(request_->keep_alive());
        convertHeaders(coreResponse_, resp.get());

        return resp;
    }

    template<typename Response>
    std::shared_ptr<void> doSend(std::shared_ptr<Response> response) const
    {
        response->prepare_payload();
        connection_->writeResponse(response.get());
        return response;
    }

    BeastConnection* connection_;
    beast::http::request<beast::http::string_body>* request_;
    ResponseCore* coreResponse_;
};

class ResponseBodyFormatter : public boost::static_visitor<bool>
{
public:
    ResponseBodyFormatter(
        ResponseCore::Body* source,
        beast::http::buffer_body::value_type* target)
        : source_(source),
          target_(target) { }

    bool format() const
    {
        return boost::apply_visitor(*this, *source_);
    }

    bool operator()(bool) const
    {
        return false;
    }

    bool operator()(std::string& str) const
    {
        if (str.empty())
            return false;

        target_->data = &str[0];
        target_->size = str.length();
        return true;
    }

    bool operator()(std::vector<uint8_t>& buffer) const
    {
        if (buffer.empty())
            return false;

        target_->data = buffer.data();
        target_->size = buffer.size();
        return true;
    }

    bool operator()(ResponseCore::FileBody&) const
    {
        return false;
    }

private:
    ResponseCore::Body* source_;
    beast::http::buffer_body::value_type* target_;
};

}

BeastRequest::BeastRequest(
    BeastConnection* connection,
    beast::http::request<beast::http::string_body>* request)
    : connection_(connection),
      request_(request)
{
    auto target = request_->target();
    auto pos = target.find('?');

    if (pos != boost::string_view::npos)
    {
        path_ = target.substr(0, pos);
        queryParams_ = target.substr(pos + 1);
    }
    else
    {
        path_ = target;
    }
}

BeastRequest::~BeastRequest() = default;

HttpMethod BeastRequest::method()
{
    switch (request_->method())
    {
    case beast::http::verb::get:
        return HttpMethod::GET;

    case beast::http::verb::post:
        return HttpMethod::POST;

    case beast::http::verb::options:
        return HttpMethod::OPTIONS;

    default:
        return HttpMethod::UNDEFINED;
    }
}

std::string BeastRequest::path()
{
    return urlDecode(path_);
}

HttpKeyValueMap BeastRequest::headers()
{
    HttpKeyValueMap headers;

    for (auto& header : *request_)
    {
        headers.emplace(
            static_cast<std::string>(header.name_string()),
            static_cast<std::string>(header.value()));
    }

    return headers;
}

HttpKeyValueMap BeastRequest::queryParams()
{
    return parseQueryString(queryParams_);
}

StringView BeastRequest::body()
{
    return StringView(request_->body());
}

void BeastRequest::abort()
{
    connection_->abort();
}

void BeastRequest::sendResponse(ResponseCorePtr response)
{
    ResponseCoreSender sender(connection_, request_, response.get());
    response_ = sender.send();
}

void BeastRequest::sendResponseBegin(ResponseCorePtr response)
{
    responseStream_ = std::make_unique<BeastResponseStream>(connection_,request_, response.get());
    responseStream_->writeHeader();
}

void BeastRequest::sendResponseBody(ResponseCore::Body chunk)
{
    responseStream_->addChunk(std::move(chunk));
}

void BeastRequest::sendResponseEnd()
{
    responseStream_->setEndOfStream();
}

void BeastRequest::requestBodyData()
{
    responseStream_->releaseBuffer();
    responseStream_->writeNextChunk();
}

BeastResponseStream::BeastResponseStream(
    BeastConnection* connection,
    beast::http::request<beast::http::string_body>* request,
    ResponseCore* coreResponse)
    : connection_(connection),
      response_(),
      serializer_(response_),
      endOfStream_(false)
{
    response_.result(convertStatusCode(coreResponse->status));
    response_.version(request->version());
    response_.keep_alive(false);
    convertHeaders(coreResponse, &response_);
    pendingChunks_.emplace(std::move(coreResponse->body));
}

BeastResponseStream::~BeastResponseStream() = default;

void BeastResponseStream::addChunk(ResponseCore::Body chunk)
{
    pendingChunks_.emplace(std::move(chunk));

    if (!connection_->busy())
        writeNextChunk();
}

void BeastResponseStream::setEndOfStream()
{
    endOfStream_ = true;

    if (pendingChunks_.empty())
        pendingChunks_.emplace(false);

    if (!connection_->busy())
        writeNextChunk();
}

void BeastResponseStream::writeHeader()
{
    connection_->writeResponseHeader(&serializer_);
}

void BeastResponseStream::writeNextChunk()
{
    assert(!connection_->busy());

    if (pendingChunks_.empty())
        return;

    currentChunk_ = std::move(pendingChunks_.front());
    pendingChunks_.pop();

    ResponseBodyFormatter formatter(&currentChunk_, &response_.body());
    formatter.format();

    auto close = pendingChunks_.empty() && endOfStream_;
    response_.body().more = !close;
    connection_->writeResponseBody(&serializer_, close);
}

void BeastResponseStream::releaseBuffer()
{
    std::string temp;
    currentChunk_ = std::move(temp);
}

}
