#include "beast_request.hpp"
#include "beast_connection.hpp"
#include "http.hpp"

namespace msrv {

namespace {

class ResponseCoreSender : public boost::static_visitor<>
{
public:
    ResponseCoreSender(
        BeastConnection* connection,
        beast::http::request<beast::http::string_body>* request,
        ResponseCore* response)
        : connection_(connection),
          request_(request),
          response_(response) { }

    void send() const
    {
        boost::apply_visitor(*this, response_->body);
    }

    void operator()(bool) const
    {
        sendEmpty();
    }

    void operator()(std::string& str) const
    {
        if (str.empty())
        {
            sendEmpty();
            return;
        }

        auto resp = createResponse<beast::http::string_body>();
        resp->body() = std::move(str);
        doSend(std::move(resp));
    }

    void operator()(std::vector<uint8_t>& buffer) const
    {
        if (buffer.empty())
        {
            sendEmpty();
            return;
        }

        auto resp = createResponse<beast::http::vector_body<uint8_t>>();
        resp->body() = std::move(buffer);
        doSend(std::move(resp));
    }

    void operator()(ResponseCore::File& fileResponse) const
    {
        if (fileResponse.size == 0)
        {
            sendEmpty();
            return;
        }

        auto resp = createResponse<beast::http::file_body>();

        beast::file file;
        file.native_handle(fileResponse.handle.release());

        boost::system::error_code error;
        resp->body().reset(std::move(file), error);

        doSend(std::move(resp));
    }

private:
    void sendEmpty() const
    {
        doSend(createResponse<beast::http::empty_body>());
    }

    template<typename Body>
    std::shared_ptr<beast::http::response<Body>> createResponse() const
    {
        auto status = beast::http::int_to_status(static_cast<unsigned>(response_->status));
        return std::make_shared<beast::http::response<Body>>(status, request_->version());
    }

    template<typename Response>
    void doSend(std::shared_ptr<Response> response) const
    {
        for (auto& header : response_->headers)
            response->set(header.first, header.second);

        response->keep_alive(request_->keep_alive());
        response->prepare_payload();
        connection_->sendResponse(std::move(response));
    }

    BeastConnection* connection_;
    beast::http::request<beast::http::string_body>* request_;
    ResponseCore* response_;
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

    default:
        return HttpMethod::UNDEFINED;
    }
}

std::string BeastRequest::path()
{
    std::string path;
    tryUnescapeUrl(path_, path);
    return path;
}

HttpKeyValueMap BeastRequest::headers()
{
    HttpKeyValueMap headers;

    for (auto& header : *request_)
    {
        headers.emplace(
            header.name_string().to_string(),
            header.value().to_string());
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
    assert(!response_);

    response_ = std::move(response);
    ResponseCoreSender sender(connection_, request_, response_.get());
    sender.send();
}

void BeastRequest::sendResponseBegin(ResponseCorePtr)
{
    throw std::runtime_error("sendResponseBegin: not implemented");
}

void BeastRequest::sendResponseBody(ResponseCore::Body)
{
    throw std::runtime_error("sendResponseBody: not implemented");
}

void BeastRequest::sendResponseEnd()
{
    throw std::runtime_error("sendResponseEnd: not implemented");
}


}
