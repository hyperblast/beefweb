#pragma once

#include "defines.hpp"
#include "request_filter.hpp"

namespace msrv {

class SettingsData;
class SettingsStore;

class BasicAuthFilter : public RequestFilter
{
public:
    BasicAuthFilter(SettingsStore* store);
    virtual ~BasicAuthFilter();

protected:
    virtual void beginRequest(Request* request) override;

private:
    void setUnauthorizedResponse(Request* request);
    bool verifyCredentials(Request* request, const SettingsData& settings);

    SettingsStore* store_;
};

}
