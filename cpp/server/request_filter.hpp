#pragma once

#include "defines.hpp"

#include <assert.h>
#include <memory>
#include <vector>

namespace msrv {

class Request;
class RequestFilter;

using RequestFilterPtr = std::unique_ptr<RequestFilter>;

class RequestFilter
{
public:
    RequestFilter() = default;
    virtual ~RequestFilter() = default;
    virtual void beginRequest(Request*)
    {
    }
    virtual void endRequest(Request*)
    {
    }

private:
    MSRV_NO_COPY_AND_ASSIGN(RequestFilter);
};

class ExecuteHandlerFilter : public RequestFilter
{
public:
    ~ExecuteHandlerFilter() override = default;

    void beginRequest(Request* request) override;
};

class RequestFilterChain
{
public:
    RequestFilterChain();
    ~RequestFilterChain();

    void add(RequestFilterPtr filter);
    void beginRequest(Request* request) const;
    void endRequest(Request* request) const;

private:
    std::vector<RequestFilterPtr> filters_;

    MSRV_NO_COPY_AND_ASSIGN(RequestFilterChain);
};

}
