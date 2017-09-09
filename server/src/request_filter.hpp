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
    RequestFilter();
    virtual ~RequestFilter();

    RequestFilter* getNext() const { return next_; }
    void setNext(RequestFilter* filter) { next_ = filter; }

    virtual void execute(Request* request);

protected:
    virtual void beginRequest(Request* request);
    virtual void endRequest(Request* request);

    void callNext(Request* request)
    {
        assert(next_);
        next_->execute(request);
    }

private:
    RequestFilter* next_;

    MSRV_NO_COPY_AND_ASSIGN(RequestFilter);
};

class ExecuteHandlerFilter : public RequestFilter
{
public:
    ExecuteHandlerFilter();
    ~ExecuteHandlerFilter();

    virtual void execute(Request* request) override;
};

class RequestFilterChain
{
public:
    RequestFilterChain();
    ~RequestFilterChain();

    void addFilter(RequestFilterPtr filter);
    void execute(Request* request) const;

private:
    std::vector<RequestFilterPtr> filters_;

    MSRV_NO_COPY_AND_ASSIGN(RequestFilterChain);
};

}
