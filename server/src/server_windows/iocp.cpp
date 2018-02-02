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

CallbackTask::~CallbackTask() = default;

void CallbackTask::execute(OverlappedResult*)
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

void IoCompletionPort::bindHandle(WindowsHandle::Type handle, void* userData)
{
    auto ret = ::CreateIoCompletionPort(handle, handle_.get(), reinterpret_cast<ULONG_PTR>(userData), 0);
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
    ::OVERLAPPED* overlapped;

    if (::GetQueuedCompletionStatus(handle_.get(), &bytes, &userData, &overlapped, timeout) != 0)
    {
        result->task = OverlappedTask::fromOverlapped(overlapped);
        result->bytesCount = bytes;
        result->userData = reinterpret_cast<void*>(userData);
        return true;
    }

    auto error = lastSystemError();
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
