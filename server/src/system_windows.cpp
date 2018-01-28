#include "file_system.hpp"

namespace msrv {

std::string formatError(ErrorCode)
{
    return std::string();
}

std::string formatErrorFor(const char*, ErrorCode)
{
    return std::string();
}

void throwSystemError(const char*, ErrorCode)
{
}

void WindowsHandleTraits::destroy(Type)
{
}

}
