#pragma once

#include "defines.hpp"

#include <stdint.h>

#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <deque>

namespace msrv {

using WorkCallback = std::function<void()>;

class WorkQueue
{
public:
    WorkQueue() { }
    virtual ~WorkQueue() { }
    virtual void enqueue(WorkCallback callback) = 0;

    MSRV_NO_COPY_AND_ASSIGN(WorkQueue);
};

class ImmediateWorkQueue : public WorkQueue
{
public:
    ImmediateWorkQueue();
    ~ImmediateWorkQueue();

    virtual void enqueue(WorkCallback callback) override;
};

class ThreadWorkQueue : public WorkQueue
{
public:
    ThreadWorkQueue();
    ~ThreadWorkQueue();

    virtual void enqueue(WorkCallback callback) override;

private:
    void run();

    std::thread thread_;
    std::mutex mutex_;
    std::condition_variable ready_;
    std::deque<WorkCallback> enqueued_;
    std::deque<WorkCallback> executing_;
    bool isShutdown_;
};

}
