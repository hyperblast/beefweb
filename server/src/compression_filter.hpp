#pragma once

#include "defines.hpp"
#include "request_filter.hpp"

#include <string>
#include <unordered_set>

namespace msrv {

class Request;

class CompressionFilter : public RequestFilter
{
public:
    CompressionFilter();
    virtual ~CompressionFilter();

protected:
    virtual void endRequest(Request* request) override;

private:
    std::unordered_set<std::string> contentTypes_;
};

}
