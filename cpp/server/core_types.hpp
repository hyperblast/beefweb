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
    // S_ prefix to avoid clashes with frequently defined FALSE/TRUE constants, S_TOGGLE for consistency
    S_FALSE,
    S_TRUE,
    S_TOGGLE
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

    InvalidRequestException(const std::string& str)
        : std::runtime_error(str)
    {
    }

    ~InvalidRequestException();
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
