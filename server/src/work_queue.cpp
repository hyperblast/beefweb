#include "work_queue.hpp"
#include "log.hpp"

#include <algorithm>

namespace msrv {

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
{
    thread_ = std::thread([this] { run(); });
}

ThreadWorkQueue::~ThreadWorkQueue()
{
    if (thread_.joinable())
    {
        {
            std::lock_guard<std::mutex> lock(mutex_);
            isShutdown_ = true;
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

            while (enqueued_.empty() && !isShutdown_)
                ready_.wait(lock);

            if (isShutdown_)
                return;

            std::swap(executing_, enqueued_);
        }

        for (auto& item : executing_)
            tryCatchLog([&]{ item(); });

        executing_.clear();
    }
}

}
