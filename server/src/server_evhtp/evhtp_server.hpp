#pragma once

#include "../server_core.hpp"
#include "libevent_glue.hpp"
#include "libevhtp_glue.hpp"

namespace msrv {
namespace server_evhtp {

class EvhtpServer : public ServerCore
{
public:
    EvhtpServer();
    virtual ~EvhtpServer();

    virtual WorkQueue* workQueue() override { return &workQueue_; }
    virtual TimerFactory* timerFactory() override { return &timerFactory_; }

    virtual void setEventListener(RequestEventListener* listener) override;
    virtual void bind(int port, bool allowRemote) override;

    virtual void run() override { eventBase_.runLoop(); }
    virtual void exit() override { eventBase_.exitLoop(); }

private:
    EventBase eventBase_;
    EventBaseWorkQueue workQueue_;
    EventTimerFactory timerFactory_;
    EvhtpHost host4_;
    EvhtpHost host6_;
};

}}
