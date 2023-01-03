#include "system.hpp"

namespace msrv {

std::string formatError(ErrorCode errorCode)
{
    char buffer[256];
    return std::string(formatError(errorCode, buffer, sizeof(buffer)));
}

std::string formatErrorFor(const char* func, ErrorCode errorCode)
{
    return std::string(func) + " failed: " + formatError(errorCode);
}

void throwSystemError(const char* func, ErrorCode errorCode)
{
    throw std::runtime_error(formatErrorFor(func, errorCode));
}

}
