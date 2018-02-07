#include "request.hpp"
#include "response.hpp"
#include "log.hpp"

namespace msrv {

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

Request::~Request()
{
}

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

RequestHandler::RequestHandler()
{
}

RequestHandler::~RequestHandler()
{
}

WorkQueue* RequestHandler::workQueue()
{
    return nullptr;
}

}
