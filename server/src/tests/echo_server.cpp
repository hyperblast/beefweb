#include "test_main.hpp"

#include "../chrono.hpp"
#include "../server_thread.hpp"
#include "../request_filter.hpp"
#include "../router.hpp"
#include "../work_queue.hpp"

#include <stdio.h>

#include <boost/thread/future.hpp>

namespace msrv {

class EchoHeadersFilter : public RequestFilter
{
protected:
    void endRequest(Request* request) override
    {
        auto* response = request->response.get();

        if (!response)
            return;

        for (auto& pair : request->headers)
            response->headers.emplace("X-Echo-" + pair.first, pair.second);
    }
};

class EchoController : ControllerBase
{
public:
    static void defineRoutes(Router* router, WorkQueue* workQueue)
    {
        auto routes = router->defineRoutes<EchoController>();

        routes.createWith([](Request* request) { return new EchoController(request); });
        routes.useWorkQueue(workQueue);

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
    static constexpr int PORT = MSRV_DEFAULT_TEST_PORT;

    EchoServer(bool allowRemote, ServerReadyCallback readyCallback)
        : thread_(std::move(readyCallback))
    {
        EchoController::defineRoutes(&router_, &workQueue_);

        filters_.addFilter(std::make_unique<EchoHeadersFilter>());
        filters_.addFilter(std::make_unique<ExecuteHandlerFilter>());

        auto config = std::make_unique<ServerConfig>();

        config->allowRemote = allowRemote;
        config->port = PORT;
        config->router = &router_;
        config->filters = &filters_;

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

int testMain(int argc, char** argv)
{
    bool allowRemote = false;

    for (int i = 1; i < argc; i++)
    {
        if (strcmp(argv[i], "-remote") == 0)
        {
            allowRemote = true;
        }
        else
        {
            logError("invalid option: %s\n\nusage: echo_server [-remote]", argv[i]);
            return 1;
        }
    }

    EchoServer server(allowRemote, []
    {
        logInfo("server is running");
        logInfo("press q<ENTER> to stop, press e<ENTER> to dispatch events");
    });

    while (true)
    {
        switch (::getchar())
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

