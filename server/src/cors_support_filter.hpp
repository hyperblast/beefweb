#pragma once
#include "request_filter.hpp"

namespace msrv {
class CorsSupportFilter: public RequestFilter
{
public:
    CorsSupportFilter(std::string value);
    ~CorsSupportFilter();
    virtual void endRequest(Request* request) override;

private:
    const std::string value_;
};

}
