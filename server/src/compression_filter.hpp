#pragma once

#include "defines.hpp"
#include "request_filter.hpp"

namespace msrv {

class Request;

class CompressionFilter : public RequestFilter
{
public:
    CompressionFilter();
    virtual ~CompressionFilter();

protected:
    virtual void endRequest(Request* request) override;
};

}
