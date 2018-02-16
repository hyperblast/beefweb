#pragma once

#include "http.hpp"
#include "request.hpp"
#include "response.hpp"

#include <functional>

namespace msrv {

template<typename T>
using ControllerFactory = std::function<T*(Request*)>;

template<typename T>
using ControllerAction = std::function<ResponsePtr(T*)>;

class ControllerBase
{
public:
    ControllerBase(Request* request)
        : request_(request) { }

    Request* request() { return request_; }

    template<typename T>
    T param(const std::string& key)
    {
        return request()->getParam<T>(key);
    }

    template<typename T>
    boost::optional<T> optionalParam(const std::string& key)
    {
        return request()->getOptionalParam<T>(key);
    }

    template<typename T>
    T optionalParam(const std::string& key, T fallback)
    {
        auto result = optionalParam<T>(key);
        return result ? *result : fallback;
    }

private:
    Request* request_;
};

template<typename T>
class DelegateRequestHandler : public RequestHandler
{
public:
    DelegateRequestHandler(
        std::unique_ptr<T> controller, ControllerAction<T> action, WorkQueue* queue)
        : controller_(std::move(controller)), action_(std::move(action)), workQueue_(queue) { }

    WorkQueue* workQueue() override
    {
        return workQueue_;
    }

    ResponsePtr execute() override
    {
        return action_(controller_.get());
    }

private:
    std::unique_ptr<T> controller_;
    ControllerAction<T> action_;
    WorkQueue* workQueue_;
};

template<typename T>
class DelegateRequestHandlerFactory : public RequestHandlerFactory
{
public:
    DelegateRequestHandlerFactory(ControllerFactory<T> factory, ControllerAction<T> action, WorkQueue* queue)
        : factory_(std::move(factory)), action_(std::move(action)), workQueue_(queue) { }

    ~DelegateRequestHandlerFactory() = default;

    RequestHandlerPtr createHandler(Request* request) override
    {
        return std::make_unique<DelegateRequestHandler<T>>(
            std::unique_ptr<T>(factory_(request)), action_, workQueue_);
    }

private:
    ControllerFactory<T> factory_;
    ControllerAction<T> action_;
    WorkQueue* workQueue_;
};

}
