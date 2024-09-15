#pragma once

#include "http.hpp"
#include "json.hpp"
#include "core_types.hpp"
#include "parsing.hpp"

#include <memory>

#include <boost/optional.hpp>

namespace msrv {

class WorkQueue;

class Request;
class RequestHandler;
class RequestHandlerFactory;
class Response;

using RequestHandlerPtr = std::unique_ptr<RequestHandler>;
using RequestHandlerFactoryPtr = std::unique_ptr<RequestHandlerFactory>;

class Request
{
public:
    Request();
    Request(HttpMethod methodVal, std::string pathVal);
    ~Request();

    HttpMethod method;
    std::string path;
    HttpKeyValueMap headers;
    HttpKeyValueMap routeParams;
    HttpKeyValueMap queryParams;
    Json postData;
    RequestHandlerPtr handler;
    std::unique_ptr<Response> response;
    int lastFilter = -1;

    template<typename T>
    T param(const std::string& key);

    template<typename T>
    boost::optional<T> optionalParam(const std::string& key);

    template<typename T>
    T bodyParam(const std::string& key);

    template<typename T>
    boost::optional<T> optionalBodyParam(const std::string& key);

    bool isProcessed() const { return isProcessed_; }
    void setProcessed() { isProcessed_ = true; }

    const std::string& getHeader(const std::string& key)
    {
        auto it = headers.find(key);
        return it != headers.end() ? it->second : emptyHeader_;
    }

    void executeHandler();

private:
    template<typename T>
    bool tryGetParam(const HttpKeyValueMap& params, const std::string& key, T* outVal);

    template<typename T>
    bool tryGetParam(const Json& json, const std::string& key, T* outVal);

    template<typename T>
    bool tryGetParam(const std::string& key, T* outVal);

    void setErrorResponse(std::string message, std::string param);

    bool isProcessed_;
    bool isHandlerExecuted_;
    std::string emptyHeader_;

    MSRV_NO_COPY_AND_ASSIGN(Request);
};

class RequestHandler
{
public:
    RequestHandler();
    virtual ~RequestHandler();
    virtual std::unique_ptr<Response> execute() = 0;

    MSRV_NO_COPY_AND_ASSIGN(RequestHandler);
};

class RequestHandlerFactory
{
public:
    static RequestHandlerFactory* empty();

    RequestHandlerFactory() = default;
    virtual ~RequestHandlerFactory() = default;
    virtual WorkQueue* workQueue() = 0;
    virtual RequestHandlerPtr createHandler(Request* request) = 0;

    MSRV_NO_COPY_AND_ASSIGN(RequestHandlerFactory);
};

template<typename T>
bool Request::tryGetParam(const HttpKeyValueMap& params, const std::string& key, T* outVal)
{
    auto it = params.find(key);

    if (it == params.end())
        return false;

    if (tryParseValue(it->second, outVal))
        return true;

    setErrorResponse("invalid value format", key);

    throw InvalidRequestException();
}

template<typename T>
bool Request::tryGetParam(const Json& json, const std::string& key, T* outVal)
{
    auto value = json.find(key);

    if (value == json.end())
        return false;

    std::string errorMessage;

    try
    {
        *outVal = value->get<T>();
        return true;
    }
    catch(std::exception& ex)
    {
        errorMessage = ex.what();
    }
    catch(...)
    {
        errorMessage = "invalid value format";
    }

    setErrorResponse(std::move(errorMessage), key);
    throw InvalidRequestException();
}

template<typename T>
bool Request::tryGetParam(const std::string& key, T* outVal)
{
    return tryGetParam(routeParams, key, outVal)
        || tryGetParam(queryParams, key, outVal)
        || tryGetParam(postData, key, outVal);
}

template<typename T>
T Request::param(const std::string& key)
{
    T result;

    if (tryGetParam(key, &result))
        return result;

    setErrorResponse("parameter is required", key);
    throw InvalidRequestException();
}

template<typename T>
boost::optional<T> Request::optionalParam(const std::string& key)
{
    T result;

    if (tryGetParam(key, &result))
        return result;

    return boost::none;
}

template<typename T>
T Request::bodyParam(const std::string& key)
{
    T result;

    if (tryGetParam(postData, key, &result))
        return result;

    setErrorResponse("parameter is required", key);
    throw InvalidRequestException();
}

template<typename T>
boost::optional<T> Request::optionalBodyParam(const std::string& key)
{
    T result;

    if (tryGetParam(postData, key, &result))
        return result;

    return boost::none;
}

}
