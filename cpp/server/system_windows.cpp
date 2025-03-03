#include "file_system.hpp"
#include "safe_windows.h"
#include <string.h>

namespace msrv {

typedef HRESULT (WINAPI *SetThreadDescriptionFunc)(HANDLE thread, LPCWSTR name);

void setThreadName(ThreadName name)
{
    static auto setName = reinterpret_cast<SetThreadDescriptionFunc>(
        GetProcAddress(LoadLibraryA("kernelbase.dll"), "SetThreadDescription"));

    if (setName)
        setName(GetCurrentThread(), name);
}

const char* formatError(ErrorCode errorCode, char* buffer, size_t size) noexcept
{
    auto ret = ::FormatMessageA(
        FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
        nullptr,
        errorCode,
        MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
        buffer,
        size,
        nullptr);

    if (ret == 0)
        return "Unknown error (failed to obtain error message)";

    return buffer;
}

void WindowsHandleTraits::destroy(Type handle) noexcept
{
    ::CloseHandle(handle);
}

ErrorCode lastSystemError() noexcept
{
    return ::GetLastError();
}

}
