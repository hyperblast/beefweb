#include "../server_core.hpp"
#include "iocp.hpp"
#include "event_loop.hpp"
#include "http_api.hpp"

#include <memory>
#include <thread>

namespace msrv {
namespace server_windows {

class HttpServer final : public ServerCore
{
public:
    HttpServer();
    virtual ~HttpServer();

    virtual WorkQueue* workQueue() override
    {
        return &workQueue_;
    }

    virtual TimerFactory* timerFactory() override
    {
        return eventLoop_.timerFactory();
    }

    virtual void bind(int port, bool allowRemote) override;

    virtual void setEventListener(RequestEventListener* listener) override
    {
        requestQueue_.setListener(listener);
    }

    virtual void run() override
    {
        requestQueue_.start();
        eventLoop_.run();
    }

    virtual void exit() override
    {
        eventLoop_.exit();
    }

private:
    IoCompletionPort ioPort_;
    EventLoop eventLoop_;
    IoWorkQueue workQueue_;
    HttpRequestQueue requestQueue_;
};

}}
