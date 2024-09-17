#pragma once

#include "defines.hpp"

#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <vector>
#include <boost/thread/future.hpp>

namespace msrv {

using WorkCallback = std::function<void()>;

class WorkQueue
{
public:
    virtual ~WorkQueue();
    virtual void enqueue(WorkCallback callback) = 0;

protected:
    WorkQueue() = default;

    MSRV_NO_COPY_AND_ASSIGN(WorkQueue);
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
    ~ExternalWorkQueue();

    virtual void enqueue(WorkCallback callback) override;

protected:
    ExternalWorkQueue();

    virtual void schedule(WorkCallback callback) = 0;

private:
    struct State
    {
        State() = default;

        ~State()
        {
            destroyed.set_value();
        }

        std::mutex mutex;
        std::vector<WorkCallback> enqueued;
        std::vector<WorkCallback> executing;
        boost::promise<void> destroyed;

        MSRV_NO_COPY_AND_ASSIGN(State);
    };

    static void execute(State* state);

    std::shared_ptr<State> state_;
};

}
