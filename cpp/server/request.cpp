#include "request.hpp"
#include "response.hpp"
#include "log.hpp"

namespace msrv {

namespace {

class EmptyRequestHandler : public RequestHandler
{
public:
    std::unique_ptr<Response> execute() override
    {
        return Response::custom(HttpStatus::S_204_NO_CONTENT);
    }
};

class EmptyRequestHandlerFactory : public RequestHandlerFactory
{
public:
    WorkQueue* workQueue() override
    {
        return nullptr;
    }

    RequestHandlerPtr createHandler(Request*) override
    {
        return std::make_unique<EmptyRequestHandler>();
    }
};

}

Request::Request()
    : method(HttpMethod::GET),
      isProcessed_(false),
      isHandlerExecuted_(false)
{
}

Request::Request(HttpMethod methodVal, std::string pathVal)
    : method(methodVal),
      path(std::move(pathVal)),
      isProcessed_(false),
      isHandlerExecuted_(false)
{
}

Request::~Request() = default;

void Request::setErrorResponse(std::string message, std::string param)
{
    response = Response::error(HttpStatus::S_400_BAD_REQUEST, std::move(message), std::move(param));
}

void Request::executeHandler()
{
    assert(handler);
    assert(!isHandlerExecuted_);
    isHandlerExecuted_ = true;
    response = handler->execute();
}

RequestHandlerFactory* RequestHandlerFactory::empty()
{
    static EmptyRequestHandlerFactory factory;
    return &factory;
}

}
