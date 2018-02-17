#include "iocp.hpp"
#include "../log.hpp"

namespace msrv {
namespace server_windows {

OverlappedTask::OverlappedTask()
{
    ::memset(&wrapper_.overlapped, 0, sizeof(wrapper_.overlapped));
    wrapper_.task = this;
}

OverlappedTask::~OverlappedTask() = default;

void OverlappedTask::handleAsyncIoResult(DWORD errorCode)
{
    if (errorCode == ERROR_IO_PENDING)
        return;

    OverlappedResult result;
    result.task = TaskPtr<OverlappedTask>(this, false);
    result.bytesCount = 0;
    result.ioError = errorCode;
    complete(&result);
}

CallbackTask::~CallbackTask() = default;

void CallbackTask::complete(OverlappedResult*)
{
    if (callback_)
        tryCatchLog([this] { callback_(); });
}

IoCompletionPort::IoCompletionPort(int concurrency)
{
    handle_.reset(::CreateIoCompletionPort(INVALID_HANDLE_VALUE, nullptr, 0, concurrency));
    throwIfFailed("CreateIoCompletionPort", handle_);
}

IoCompletionPort::~IoCompletionPort() = default;

void IoCompletionPort::bindHandle(WindowsHandle::Type handle)
{
    auto ret = ::CreateIoCompletionPort(handle, handle_.get(), 0, 0);
    throwIfFailed("CreateIoCompletionPort", WindowsHandle::TraitsType::isValid(ret));
}

void IoCompletionPort::post(TaskPtr<CallbackTask> task)
{
    if (::PostQueuedCompletionStatus(handle_.get(), 0, 0, task->toOverlapped()) != 0)
        return;

    auto error = lastSystemError();
    intrusive_ptr_release(task.get());
    throwSystemError("PostQueuedCompletionStatus", error);
}

bool IoCompletionPort::waitResultImpl(OverlappedResult* result, ::DWORD timeout)
{
    ::DWORD bytes;
    ::ULONG_PTR userData;
    ::OVERLAPPED* overlapped = nullptr;

    if (::GetQueuedCompletionStatus(handle_.get(), &bytes, &userData, &overlapped, timeout) != 0)
    {
        // Operation completed successfully

        result->task = OverlappedTask::fromOverlapped(overlapped);
        result->bytesCount = bytes;
        result->ioError = NO_ERROR;
        return true;
    }

    auto error = ::GetLastError();

    if (overlapped != nullptr)
    {
        // Operation completed with error

        result->task = OverlappedTask::fromOverlapped(overlapped);
        result->bytesCount = bytes;
        result->ioError = error;
        return true;
    }

    // Failed to dequeue operation

    if (error == WAIT_TIMEOUT)
        return false;

    throwSystemError("GetQueuedCompletionStatus", error);
    return false;
}

IoWorkQueue::IoWorkQueue(IoCompletionPort* ioPort)
    : ioPort_(ioPort)
{
    executeTask_ = createTask<CallbackTask>([this] { execute(); });
}

IoWorkQueue::~IoWorkQueue() = default;

void IoWorkQueue::schedule()
{
    ioPort_->post(executeTask_);
}

}}
