#include "work_queue.hpp"
#include "log.hpp"

#include <algorithm>

namespace msrv {

WorkQueue::~WorkQueue() = default;

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
    : state_(std::make_shared<State>())
{
}

ExternalWorkQueue::~ExternalWorkQueue()
{
    auto stateDestroyed = state_->destroyed.get_future();
    state_.reset();
    stateDestroyed.wait();
}

void ExternalWorkQueue::enqueue(WorkCallback callback)
{
    bool willSchedule;

    {
        std::lock_guard<std::mutex> lock(state_->mutex);
        willSchedule = state_->enqueued.empty();
        state_->enqueued.emplace_back(std::move(callback));
    }

    if (!willSchedule)
        return;

    std::weak_ptr<State> stateWeak = state_;

    schedule([stateWeak]
    {
        if (auto state =  stateWeak.lock())
            execute(state.get());
    });
}

void ExternalWorkQueue::execute(State* state)
{
    {
        std::unique_lock<std::mutex> lock(state->mutex);
        std::swap(state->executing, state->enqueued);
    }

    for (auto& item : state->executing)
        tryCatchLog([&]{ item(); });

    state->executing.clear();
}

}
