#pragma once
#include "request_filter.hpp"
#include "settings.hpp"

namespace msrv {
class ResponseHeadersFilter : public RequestFilter
{
public:
    explicit ResponseHeadersFilter(SettingsDataPtr settings);
    ~ResponseHeadersFilter() override;
    virtual void endRequest(Request* request) override;

private:
    SettingsDataPtr settings_;
};

}
