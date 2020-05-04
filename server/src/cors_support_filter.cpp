#include "request.hpp"
#include "response.hpp"
#include "cors_support_filter.hpp"

namespace msrv {

CorsSupportFilter::CorsSupportFilter(std::string value)
    : value_(std::move(value)) {}

CorsSupportFilter::~CorsSupportFilter() = default;

void CorsSupportFilter::endRequest(Request* request)
{
    if (!request->response)
        return;

    auto& headers = request->response->headers;
    headers["Access-Control-Allow-Origin"] = value_;
    headers["Access-Control-Allow-Method"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = HttpHeader::CONTENT_TYPE;
}

}