#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

#include <string>
#include <stdexcept>
#include <memory>

namespace msrv {

enum class Switch
{
    // SW_ prefix to avoid clashes with frequently defined FALSE/TRUE constants, SW_TOGGLE for consistency
    SW_FALSE,
    SW_TRUE,
    SW_TOGGLE
};

struct Range
{
    Range() = default;

    Range(int32_t offsetVal, int32_t countVal = 1)
        : offset(offsetVal), count(countVal)
    {
    }

    int32_t offset;
    int32_t count;

    int32_t endOffset() const
    {
        return offset + count;
    }
};

class InvalidRequestException : public std::runtime_error
{
public:
    InvalidRequestException()
        : std::runtime_error("invalid request")
    {
    }

    explicit InvalidRequestException(const std::string& str)
        : std::runtime_error(str)
    {
    }

    ~InvalidRequestException() = default;
};

class OperationForbiddenException : public std::runtime_error
{
public:
    OperationForbiddenException()
        : std::runtime_error("operation is not allowed by current configuration")
    {
    }

    explicit OperationForbiddenException(const std::string& str)
        : std::runtime_error(str)
    {
    }

    ~OperationForbiddenException() = default;
};

template<typename T>
struct MallocDeleter
{
    void operator()(T* ptr)
    {
        ::free(ptr);
    }
};

template<typename T>
using MallocPtr = std::unique_ptr<T, MallocDeleter<T>>;

}
