#pragma once

#include "defines.hpp"
#include "request_filter.hpp"
#include "settings.hpp"

namespace msrv {

class BasicAuthFilter : public RequestFilter
{
public:
    explicit BasicAuthFilter(SettingsDataPtr settings);
    ~BasicAuthFilter() override;

protected:
    virtual void beginRequest(Request* request) override;

private:
    void setUnauthorizedResponse(Request* request);
    bool verifyCredentials(Request* request);

    std::string credentials_;
};

}
