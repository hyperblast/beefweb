#include "request.hpp"
#include "response.hpp"
#include "response_headers_filter.hpp"

namespace msrv {

ResponseHeadersFilter::ResponseHeadersFilter(SettingsDataPtr settings)
    : settings_(settings) { }

ResponseHeadersFilter::~ResponseHeadersFilter() = default;

void ResponseHeadersFilter::endRequest(Request* request)
{
    if (request->response)
        request->response->addHeaders(settings_->responseHeaders);
}

}
