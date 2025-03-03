#pragma once

#include "defines.hpp"
#include "system.hpp"

#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <vector>
#include <deque>
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
    explicit ThreadWorkQueue(ThreadName name = nullptr);
    ~ThreadWorkQueue();

    void enqueue(WorkCallback callback) override;

private:
    void run();

    std::thread thread_;
    std::mutex mutex_;
    std::condition_variable ready_;
    std::vector<WorkCallback> enqueued_;
    std::vector<WorkCallback> executing_;
    bool shutdown_ = false;
};

class ThreadPoolWorkQueue : public WorkQueue
{
public:
    explicit ThreadPoolWorkQueue(size_t workers, ThreadName name = nullptr);
    ~ThreadPoolWorkQueue();

    void enqueue(WorkCallback callback) override;

private:
    void run();

    std::vector<std::thread> threads_;
    std::mutex mutex_;
    std::condition_variable ready_;
    std::deque<WorkCallback> enqueued_;
    bool shutdown_ = false;
};

class ExternalWorkQueue : public WorkQueue
{
public:
    ~ExternalWorkQueue();

    void enqueue(WorkCallback callback) override;

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
