#include "request.hpp"
#include "response.hpp"
#include "log.hpp"

namespace msrv {

Request::Request()
    : id(0), method(HttpMethod::GET), isProcessed_(false)
{
}

Request::Request(HttpMethod methodVal, std::string pathVal)
    : id(0), method(methodVal), path(std::move(pathVal)), isProcessed_(false)
{
}

Request::~Request()
{
}

void Request::setErrorResponse(std::string message, std::string param)
{
    response = Response::error(HttpStatus::S_400_BAD_REQUEST, std::move(message), std::move(param));
}

void Request::process()
{
    assert(!isProcessed());
    assert(handler);

    try
    {
        response = handler->execute();
    }
    catch (InvalidRequestException& ex)
    {
        if (!response || isSuccessStatus(response->status))
            response = Response::error(HttpStatus::S_400_BAD_REQUEST, ex.what());
    }
    catch (std::exception& ex)
    {
        logError("%s", ex.what());
        response = Response::error(HttpStatus::S_500_SERVER_ERROR, ex.what());
    }
    catch (...)
    {
        logError("unknown error");
        response = Response::error(HttpStatus::S_500_SERVER_ERROR, "unknown error");
    }

    setProcessed();
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
