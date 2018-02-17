#include "http_server.hpp"
#include "../log.hpp"

namespace msrv {

ServerCorePtr ServerCore::create()
{
    return std::make_unique<server_windows::HttpServer>();
}

namespace server_windows {

HttpServer::HttpServer()
    : ioPort_(1),
      eventLoop_(&ioPort_),
      workQueue_(&ioPort_),
      requestQueue_(&ioPort_)
{
}

HttpServer::~HttpServer()
{
}

void HttpServer::bind(int port, bool)
{
    std::wostringstream prefix;
    prefix << L"http://localhost:" << port << L"/";
    requestQueue_.bind(prefix.str());
}

}}
