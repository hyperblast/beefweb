#include "system.hpp"

#include <assert.h>
#include <string.h>

#include <unistd.h>

#include <memory>

namespace msrv {

namespace {

const char* safeStrError(int val, char* buf, size_t size)
{
    return ::strerror_r(val, buf, size);
}

}

void PosixHandleTraits::destroy(Type value)
{
    ::close(value);
}

std::string formatError(ErrorCode errorCode)
{
    char buf[1024];

    return std::string(safeStrError(errorCode, buf, sizeof(buf)));
}

std::string formatErrorFor(const char* func, ErrorCode errorCode)
{
    char messageBuf[1024];
    char errorBuf[512];

    ::snprintf(
        messageBuf,
        sizeof(messageBuf),
        "%s failed: %s",
        func,
        safeStrError(errorCode, errorBuf, sizeof(errorBuf)));

    return std::string(messageBuf);
}

void throwSystemError(const char* func, ErrorCode errorCode)
{
    throw std::runtime_error(formatErrorFor(func, errorCode));
}

}
