#pragma once

#include "../defines.hpp"
#include "../chrono.hpp"
#include "../system.hpp"
#include "../work_queue.hpp"

#include <stdint.h>

#include <utility>

#include <boost/smart_ptr/intrusive_ptr.hpp>
#include <boost/smart_ptr/intrusive_ref_counter.hpp>

#include "../safe_windows.h"

namespace msrv {
namespace server_windows {

template<typename T>
using TaskPtr = boost::intrusive_ptr<T>;

template<typename T, typename ... Args>
inline TaskPtr<T> createTask(Args&& ... args)
{
    return TaskPtr<T>(new T(std::forward<Args>(args) ...));
}

struct OverlappedResult;

class OverlappedTask
    : public boost::intrusive_ref_counter<OverlappedTask, boost::thread_safe_counter>
{
public:
    static TaskPtr<OverlappedTask> fromOverlapped(::OVERLAPPED* overlapped)
    {
        auto wrapper = reinterpret_cast<Wrapper*>(overlapped);
        return TaskPtr<OverlappedTask>(wrapper->task, false);
    }

    OverlappedTask();
    virtual ~OverlappedTask();
    virtual void complete(OverlappedResult* result) = 0;

    ::OVERLAPPED* toOverlapped()
    {
        intrusive_ptr_add_ref(this);
        return &wrapper_.overlapped;
    }

protected:
    void handleAsyncIoResult(DWORD errorCode);

private:
    struct Wrapper
    {
        ::OVERLAPPED overlapped;
        OverlappedTask* task;
    };

    Wrapper wrapper_;

    MSRV_NO_COPY_AND_ASSIGN(OverlappedTask);
};

class CallbackTask final : public OverlappedTask
{
public:
    CallbackTask(WorkCallback callback = WorkCallback())
        : callback_(std::move(callback)) { }

    virtual ~CallbackTask();
    virtual void complete(OverlappedResult* result) override;

    void setCallback(WorkCallback callback) { callback_ = std::move(callback); }

private:
    WorkCallback callback_;
};

struct OverlappedResult
{
    TaskPtr<OverlappedTask> task;
    uint32_t bytesCount;
    ErrorCode ioError;
};

class IoCompletionPort
{
public:
    IoCompletionPort(int concurrency = 0);
    ~IoCompletionPort();

    void bindHandle(WindowsHandle::Type handle);

    void post(WorkCallback callback = WorkCallback())
    {
        post(createTask<CallbackTask>(std::move(callback)));
    }

    void post(TaskPtr<CallbackTask> task);

    bool getResult(OverlappedResult* result)
    {
        return waitResultImpl(result, 0);
    }

    bool waitResult(OverlappedResult* result)
    {
        return waitResultImpl(result, INFINITE);
    }

    bool waitResult(OverlappedResult* result, DurationMs timeout)
    {
        return waitResultImpl(result, static_cast<::DWORD>(timeout.count()));
    }

private:
    bool waitResultImpl(OverlappedResult* result, ::DWORD timeout);
    WindowsHandle handle_;

    MSRV_NO_COPY_AND_ASSIGN(IoCompletionPort);
};

class IoWorkQueue final : public ExternalWorkQueue
{
public:
    IoWorkQueue(IoCompletionPort* ioPort);
    ~IoWorkQueue();

protected:
    void schedule() override;

private:
    IoCompletionPort* ioPort_;
    TaskPtr<CallbackTask> executeTask_;
};

}}

