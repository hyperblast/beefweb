#include "basic_auth_filter.hpp"
#include "base64.hpp"
#include "request.hpp"
#include "response.hpp"
#include "settings.hpp"
#include "project_info.hpp"

#include <boost/algorithm/string.hpp>

namespace msrv {

namespace {

const char BASIC_AUTH_PREFIX[] = "Basic ";
const char WWW_AUTHENTICATE_VALUE[] = "Basic realm=\"" MSRV_PROJECT_NAME "\"";

}

BasicAuthFilter::BasicAuthFilter(SettingsStore* store)
    : store_(store)
{
}

BasicAuthFilter::~BasicAuthFilter() = default;

void BasicAuthFilter::beginRequest(Request* request)
{
    const auto& settings = store_->settings();

    if (!settings.authRequired || verifyCredentials(request, settings))
        return;

    setUnauthorizedResponse(request);
}

bool BasicAuthFilter::verifyCredentials(Request* request, const SettingsData& settings)
{
    auto authHeader = request->headers.find(HttpHeader::AUTHORIZATION);
    if (authHeader == request->headers.end())
        return false;

    const auto& authValue = authHeader->second;
    if (!boost::starts_with(authValue, BASIC_AUTH_PREFIX))
        return false;

    const auto credentials = base64Decode(authValue.substr(sizeof(BASIC_AUTH_PREFIX) - 1));
    return credentials == settings.authUser + ":" + settings.authPassword;
}

void BasicAuthFilter::setUnauthorizedResponse(Request* request)
{
    request->response = Response::error(HttpStatus::S_401_UNAUTHORIZED, "Authentication required");
    request->response->headers[HttpHeader::WWW_AUTHENTICATE] = WWW_AUTHENTICATE_VALUE;
    request->setProcessed();
}

}
