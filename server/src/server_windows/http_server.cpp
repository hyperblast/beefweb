#include "http_server.hpp"
#include "../log.hpp"
#include "../charset.hpp"

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

void HttpServer::bind(int port, bool allowRemote)
{
    auto prefix = formatString(
        "http://%s:%d/",
        allowRemote ? "+" : "localhost",
        port);

    requestQueue_.bind(prefix);
}

}}
