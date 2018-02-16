#pragma once

#include "defines.hpp"

#include <stdint.h>

#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <vector>

namespace msrv {

using WorkCallback = std::function<void()>;

class WorkQueue
{
public:
    WorkQueue() { }
    virtual ~WorkQueue();
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
    std::vector<WorkCallback> enqueued_;
    std::vector<WorkCallback> executing_;
    bool shutdown_;
};

class ExternalWorkQueue : public WorkQueue
{
public:
    ExternalWorkQueue();
    ~ExternalWorkQueue();

    virtual void enqueue(WorkCallback callback) override;

protected:
    void execute();
    virtual void schedule() = 0;

private:
    std::mutex mutex_;
    std::vector<WorkCallback> enqueued_;
    std::vector<WorkCallback> executing_;
};

}
