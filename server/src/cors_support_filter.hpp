#pragma once
#include "request_filter.hpp"

namespace msrv {
class CorsSupportFilter: public RequestFilter
{
public:
    CorsSupportFilter(std::string value);
    ~CorsSupportFilter();

private:
    const std::string value_;
};

}
