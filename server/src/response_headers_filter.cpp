#include "request.hpp"
#include "response.hpp"
#include "response_headers_filter.hpp"

namespace msrv {

ResponseHeadersFilter::ResponseHeadersFilter(SettingsDataPtr settings)
    : settings_(settings) { }

ResponseHeadersFilter::~ResponseHeadersFilter() = default;

void ResponseHeadersFilter::endRequest(Request* request)
{
    if (!request->response)
        return;

    const auto& fromHeaders = settings_->responseHeaders;
    auto& toHeaders = request->response->headers;

    for (const auto& kv : fromHeaders)
        toHeaders[kv.first] = kv.second;
}

}
