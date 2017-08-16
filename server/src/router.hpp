#pragma once

#include "defines.hpp"
#include "http.hpp"
#include "controller.hpp"

#include <functional>
#include <unordered_map>
#include <memory>

namespace msrv {

class StringSegment;

namespace router_internal { class Node; }

template<typename T> class RouteBuilder;

class RouteResult
{
public:
    RouteResult(RequestHandlerFactory* factoryVal, HttpKeyValueMap parametersVal);
    RouteResult(ResponsePtr errorResponseVal);
    ~RouteResult();

    RequestHandlerFactory* factory;
    HttpKeyValueMap params;
    ResponsePtr errorResponse;
};

class Router
{
public:
    static constexpr char URL_SEP = '/';

    Router();
    ~Router();

    void defineRoute(HttpMethod method, const std::string& path, RequestHandlerFactoryPtr factory);

    template<typename T>
    RouteBuilder<T> defineRoutes() { return RouteBuilder<T>(this); }

    std::unique_ptr<RouteResult> dispatch(const Request* request) const;

private:
    std::unique_ptr<router_internal::Node> rootNode_;

    router_internal::Node* allocateNode(
        router_internal::Node* parent, StringSegment& urlPath);

    const router_internal::Node* matchNode(
        const router_internal::Node* parent, const StringSegment& urlPath, HttpKeyValueMap& params) const;

    MSRV_NO_COPY_AND_ASSIGN(Router);
};

template<typename T>
class RouteBuilder
{
public:
    RouteBuilder(Router* router) : router_(router), workQueue_(nullptr) { }

    void createWith(ControllerFactory<T> factory)
    {
        factory_ = std::move(factory);
    }

    void setPrefix(std::string prefix)
    {
        if (prefix.empty() || prefix.back() != Router::URL_SEP)
            prefix.push_back(Router::URL_SEP);

        prefix_ = std::move(prefix);
    }

    void setWorkQueue(WorkQueue* queue)
    {
        workQueue_ = queue;
    }

    void define(HttpMethod method, const std::string& path, ControllerAction<T> action)
    {
        router_->defineRoute(
            method,
            prefix_ + path,
            RequestHandlerFactoryPtr(
                new DelegateRequestHandlerFactory<T>(factory_, std::move(action), workQueue_)));
    }

    void get(const std::string& path, ControllerAction<T> action)
    {
        define(HttpMethod::GET, path, action);
    }

    void post(const std::string& path, ControllerAction<T> action)
    {
        define(HttpMethod::POST, path, action);
    }

    void post(const std::string& path, std::function<void(T*)> action)
    {
        define(HttpMethod::POST, path, [=] (T* controller) {
            action(controller);
            return Response::ok();
        });
    }

private:
    Router* router_;
    ControllerFactory<T> factory_;
    std::string prefix_;
    WorkQueue* workQueue_;
};

}
