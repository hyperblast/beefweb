#include "test_main.hpp"
#include "../server_thread.hpp"
#include "../request_filter.hpp"
#include "../router.hpp"
#include "../work_queue.hpp"
#include <stdio.h>

namespace msrv
{

class EchoController : ControllerBase
{
public:
    static void defineRoutes(Router* router)
    {
        auto routes = router->defineRoutes<EchoController>();
        
        routes.createWith([](Request* request) { return new EchoController(request); });

        routes.get("", &handle);
        routes.get(":p*", &handle);
        routes.post("", ControllerAction<EchoController>(&handle));
        routes.post(":p*", ControllerAction<EchoController>(&handle));
    }

    EchoController(Request* request)
        : ControllerBase(request)
    {
    }

    ResponsePtr handle()
    {
        Json response;

        response["path"] = request()->path;
        response["headers"] = request()->headers;
        response["queryParams"] = request()->queryParams;
        response["body"] = request()->postData;

        return Response::json(std::move(response));
    }
};

class EchoServer
{
public:
    static constexpr int PORT = 8882;

    EchoServer()
    {
        EchoController::defineRoutes(&router_);
        filters_.addFilter(std::make_unique<ExecuteHandlerFilter>());

        auto config = std::make_unique<ServerConfig>();
        
        config->allowRemote = false;
        config->port = PORT;
        config->router = &router_;
        config->filters = &filters_;
        config->defaultWorkQueue = &workQueue_;

        thread_.restart(std::move(config));
    }

    ~EchoServer() = default;

private:
    ServerThread thread_;
    Router router_;
    RequestFilterChain filters_;
    ImmediateWorkQueue workQueue_;

    MSRV_NO_COPY_AND_ASSIGN(EchoServer);
};

}

int testMain(int argc, char* argv[])
{
    msrv::logInfo("starting server");
    msrv::EchoServer server;

    msrv::logInfo("running server at port %d, press enter to stop", msrv::EchoServer::PORT);

    for (int ch = '\0'; ch != '\n'; ch = ::getchar())
    {
    }

    return 0;
}
