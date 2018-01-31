#include "system.hpp"

#include <unistd.h>

namespace msrv {

const char* formatError(ErrorCode errorCode, char* buffer, size_t size) noexcept
{
    return ::strerror_r(errorCode, buffer, size);
}

void PosixHandleTraits::destroy(Type value) noexcept
{
    ::close(value);
}

}
