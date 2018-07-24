#pragma once

#include "server_core.hpp"
#include "beast.hpp"
#include "asio_adapters.hpp"
#include "beast_listener.hpp"

namespace msrv {

class BeastServer : public ServerCore
{
public:
    BeastServer();
    virtual ~BeastServer();

    virtual WorkQueue* workQueue() override { return &workQueue_; }
    virtual TimerFactory* timerFactory() override { return &timerFactory_; }
    virtual void setEventListener(RequestEventListener* listener) override { listener_ = listener; }

    virtual void bind(int port, bool allowRemote) override;
    virtual void run() override;
    virtual void exit() override;

private:
    std::shared_ptr<BeastListener> createListener(const asio::ip::tcp::endpoint& endpoint);

    asio::io_context context_;
    AsioWorkQueue workQueue_;
    AsioTimerFactory timerFactory_;
    RequestEventListener* listener_;
};

}
