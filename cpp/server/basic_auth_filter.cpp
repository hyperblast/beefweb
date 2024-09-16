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

BasicAuthFilter::BasicAuthFilter(SettingsDataPtr settings)
    : credentials_(settings->authUser + ":" + settings->authPassword)
{
    assert(settings->authRequired);
}

BasicAuthFilter::~BasicAuthFilter() = default;

void BasicAuthFilter::beginRequest(Request* request)
{
    if (verifyCredentials(request))
        return;

    setUnauthorizedResponse(request);
}

bool BasicAuthFilter::verifyCredentials(Request* request)
{
    const auto& authValue = request->getHeader(HttpHeader::AUTHORIZATION);
    if (!boost::starts_with(authValue, BASIC_AUTH_PREFIX))
        return false;

    const auto credentials = base64Decode(authValue.substr(sizeof(BASIC_AUTH_PREFIX) - 1));
    return credentials == credentials_;
}

void BasicAuthFilter::setUnauthorizedResponse(Request* request)
{
    request->response = Response::error(HttpStatus::S_401_UNAUTHORIZED, "Authentication required");
    request->response->headers[HttpHeader::WWW_AUTHENTICATE] = WWW_AUTHENTICATE_VALUE;
    request->setProcessed();
}

}
