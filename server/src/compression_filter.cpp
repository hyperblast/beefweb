#include "compression_filter.hpp"
#include "request.hpp"
#include "response.hpp"
#include "util.hpp"
#include "gzip.hpp"

#include <stddef.h>
#include <vector>
#include <stdexcept>
#include <memory>
#include <utility>

namespace msrv {

namespace {

class CompressionHandler : private ResponseHandler
{
public:
    CompressionHandler(Request* request, const std::unordered_set<std::string>& contentTypes);
    ~CompressionHandler() = default;

    void process();

private:
    static constexpr size_t MIN_COMPRESSION_SIZE = 860;

    bool shouldUseCompression();
    bool shouldUseCompression(const std::string& contentType);

    void makeCompressedResponse(const void* data, size_t size, const std::string& contentType);

    virtual void handleResponse(SimpleResponse*) override;
    virtual void handleResponse(DataResponse*) override;
    virtual void handleResponse(FileResponse*) override;
    virtual void handleResponse(JsonResponse*) override;
    virtual void handleResponse(ErrorResponse*) override;
    virtual void handleResponse(AsyncResponse*) override;
    virtual void handleResponse(EventStreamResponse*) override;

    Request* request_;
    const std::unordered_set<std::string>& contentTypes_;

    MSRV_NO_COPY_AND_ASSIGN(CompressionHandler);
};

CompressionHandler::CompressionHandler(Request* request, const std::unordered_set<std::string>& contentTypes)
    : request_(request), contentTypes_(contentTypes)
{
}

void CompressionHandler::process()
{
    if (request_->response)
        request_->response->process(this);
}

bool CompressionHandler::shouldUseCompression()
{
    auto acceptEncoding = request_->headers.find(HttpHeader::ACCEPT_ENCODING);
    if (acceptEncoding == request_->headers.end())
        return false;

    Tokenizer tokenizer(StringView(acceptEncoding->second), ',');

    auto gzipString = StringView("gzip");

    while (tokenizer.nextToken())
    {
        if (gzipString == tokenizer.token())
            return true;
    }

    return false;
}

bool CompressionHandler::shouldUseCompression(const std::string& contentType)
{
    return shouldUseCompression()
        && contentTypes_.find(contentType) != contentTypes_.end();
}

void CompressionHandler::makeCompressedResponse(
    const void* data, size_t size, const std::string& contentType)
{
    if (size < MIN_COMPRESSION_SIZE)
        return;

    std::vector<uint8_t> compressedData;

    if (!gzipCompress(data, size, &compressedData, size - 1))
        return;

    ResponsePtr compressedResponse = Response::data(std::move(compressedData), contentType);
    compressedResponse->headers = request_->response->headers;
    compressedResponse->headers[HttpHeader::CONTENT_ENCODING] = "gzip";

    request_->response = std::move(compressedResponse);
}

void CompressionHandler::handleResponse(DataResponse* response)
{
    if (!shouldUseCompression(response->contentType))
        return;

    makeCompressedResponse(response->data.data(), response->data.size(), response->contentType);
}

void CompressionHandler::handleResponse(JsonResponse* response)
{
    if (!shouldUseCompression())
        return;

    std::string data = response->value.dump();
    makeCompressedResponse(data.data(), data.length(), "application/json");
}

void CompressionHandler::handleResponse(FileResponse* response)
{
    if (response->info.size < static_cast<int64_t>(MIN_COMPRESSION_SIZE))
        return;

    if (!shouldUseCompression(response->contentType))
        return;

    auto data = readFileToBuffer(response->handle, response->info.size);
    makeCompressedResponse(data.data(), data.size(), response->contentType);
}

void CompressionHandler::handleResponse(SimpleResponse*)
{
}

void CompressionHandler::handleResponse(ErrorResponse*)
{
}

void CompressionHandler::handleResponse(AsyncResponse*)
{
}

void CompressionHandler::handleResponse(EventStreamResponse*)
{
}

}

CompressionFilter::CompressionFilter()
{
    contentTypes_.emplace("text/html");
    contentTypes_.emplace("image/svg+xml");
    contentTypes_.emplace("application/javascript");
    contentTypes_.emplace("text/css");
}

CompressionFilter::~CompressionFilter() = default;

void CompressionFilter::endRequest(Request* request)
{
    CompressionHandler handler(request, contentTypes_);
    handler.process();
}

}
