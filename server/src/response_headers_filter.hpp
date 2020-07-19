#pragma once
#include "request_filter.hpp"
#include "settings.hpp"

namespace msrv {
class ResponseHeadersFilter : public RequestFilter
{
public:
    explicit ResponseHeadersFilter(SettingsStore* settingsStore);
    ~ResponseHeadersFilter() override;
    virtual void endRequest(Request* request) override;

private:
    SettingsStore* settingsStore_;
};

}
