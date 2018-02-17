#include "test_main.hpp"

#include "../chrono.hpp"
#include "../server_thread.hpp"
#include "../request_filter.hpp"
#include "../router.hpp"
#include "../work_queue.hpp"

#include <stdio.h>

#include <boost/thread/future.hpp>

namespace msrv {

class EchoController : ControllerBase
{
public:
    static void defineRoutes(Router* router)
    {
        auto routes = router->defineRoutes<EchoController>();

        routes.createWith([](Request* request) { return new EchoController(request); });

        routes.get("", &EchoController::handle);
        routes.get(":p*", &EchoController::handle);
        routes.post("", ControllerAction<EchoController>(&EchoController::handle));
        routes.post(":p*", ControllerAction<EchoController>(&EchoController::handle));
    }

    EchoController(Request* request)
        : ControllerBase(request)
    {
    }

    ResponsePtr handle()
    {
        if (optionalParam<bool>("eventstream", false))
        {
            return Response::eventStream([this] { return buildResponse(); });
        }
        else if (auto delay = optionalParam<int32_t>("delay"))
        {
            if (delay <= 0)
                throw InvalidRequestException("delay should greater than 0");

            return Response::async(boost::async([this, delay]
            {
                std::this_thread::sleep_for(std::chrono::seconds(*delay));
                return ResponsePtr(Response::json(buildResponse()));
            }));
        }

        return Response::json(buildResponse());
    }

    Json buildResponse()
    {
        Json response;

        response["method"] = toString(request()->method);
        response["path"] = request()->path;
        response["headers"] = request()->headers;
        response["queryParams"] = request()->queryParams;
        response["body"] = request()->postData;
        response["ticks"] = steadyTime().time_since_epoch().count();

        return response;
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

    void dispatchEvents()
    {
        thread_.dispatchEvents();
    }

private:
    Router router_;
    RequestFilterChain filters_;
    ThreadWorkQueue workQueue_;
    ServerThread thread_;

    MSRV_NO_COPY_AND_ASSIGN(EchoServer);
};

int testMain(int, char**)
{
    EchoServer server;

    logInfo("running server at port %d", EchoServer::PORT);
    logInfo("press q<ENTER> to stop, press e<ENTER> to dispatch events");

    while (true)
    {
        int ch = std::cin.get();
        switch (ch)
        {
        case 'q':
        case 'Q':
            return 0;
        case 'e':
        case 'E':
            server.dispatchEvents();
            break;
        }
    }
}

}

