#include "system.hpp"

#include <unistd.h>
#include <string.h>

namespace msrv {

const char* formatError(ErrorCode errorCode, char* buffer, size_t size) noexcept
{
#ifdef _GNU_SOURCE
    return ::strerror_r(errorCode, buffer, size);
#else
    return ::strerror_r(errorCode, buffer, size) == 0 ? buffer : "unknown error";
#endif
}

void PosixHandleTraits::destroy(Type value) noexcept
{
    ::close(value);
}

}
