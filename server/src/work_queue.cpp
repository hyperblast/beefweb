#include "work_queue.hpp"
#include "log.hpp"

#include <algorithm>

namespace msrv {

WorkQueue::~WorkQueue() = default;

ImmediateWorkQueue::ImmediateWorkQueue()
{
}

ImmediateWorkQueue::~ImmediateWorkQueue()
{
}

void ImmediateWorkQueue::enqueue(WorkCallback callback)
{
    callback();
}

ThreadWorkQueue::ThreadWorkQueue()
    : shutdown_(false)
{
    thread_ = std::thread([this] { run(); });
}

ThreadWorkQueue::~ThreadWorkQueue()
{
    if (thread_.joinable())
    {
        {
            std::lock_guard<std::mutex> lock(mutex_);
            shutdown_ = true;
            ready_.notify_one();
        }

        thread_.join();
    }
}

void ThreadWorkQueue::enqueue(WorkCallback callback)
{
    std::lock_guard<std::mutex> lock(mutex_);
    enqueued_.emplace_back(std::move(callback));
    ready_.notify_one();
}

void ThreadWorkQueue::run()
{
    while (true)
    {
        {
            std::unique_lock<std::mutex> lock(mutex_);

            while (enqueued_.empty() && !shutdown_)
                ready_.wait(lock);

            if (shutdown_)
                return;

            std::swap(executing_, enqueued_);
        }

        for (auto& item : executing_)
            tryCatchLog([&]{ item(); });

        executing_.clear();
    }
}


ExternalWorkQueue::ExternalWorkQueue()
{
}

ExternalWorkQueue::~ExternalWorkQueue() = default;

void ExternalWorkQueue::enqueue(WorkCallback callback)
{
    bool willSchedule;

    {
        std::lock_guard<std::mutex> lock(mutex_);
        willSchedule = enqueued_.empty();
        enqueued_.emplace_back(std::move(callback));
    }

    if (willSchedule)
        schedule();
}

void ExternalWorkQueue::execute()
{
    {
        std::unique_lock<std::mutex> lock(mutex_);
        std::swap(executing_, enqueued_);
    }

    for (auto& item : executing_)
        tryCatchLog([&]{ item(); });

    executing_.clear();
}

}
