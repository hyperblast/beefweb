#pragma once

#include "defines.hpp"

#include <stdint.h>

#include <stdexcept>
#include <type_traits>
#include <vector>
#include <string>
#include <utility>

namespace msrv {

template<typename Traits>
class Handle
{
public:
    using Type = typename Traits::Type;

    static_assert(std::is_trivial<Type>::value, "Handle type should be trivial");

    Handle() noexcept
        : value_(Traits::INVALID_VALUE) { }

    explicit Handle(Type value) noexcept
        : value_(value) { }

    Handle(Handle<Traits>&& other) noexcept
        : value_(Traits::INVALID_VALUE)
    {
        std::swap(value_, other.value_);
    }

    ~Handle() noexcept
    {
        if (Traits::isValid(value_))
            Traits::destroy(value_);
    }

    Handle<Traits>& operator=(Handle<Traits>&& other) noexcept
    {
        std::swap(value_, other.value_);
        return *this;
    }

    explicit operator bool() const noexcept { return Traits::isValid(value_); }

    Type get() const noexcept { return value_; }

    void reset(Type value = Traits::INVALID_VALUE) noexcept
    {
        Type oldValue = value_;

        value_ = value;

        if (Traits::isValid(oldValue))
            Traits::destroy(oldValue);
    }

    Type release() noexcept
    {
        Type value = value_;
        value_ = Traits::INVALID_VALUE;
        return value;
    }

private:
    Type value_;

    MSRV_NO_COPY_AND_ASSIGN(Handle<Traits>);
};

struct PosixHandleTraits
{
    using Type = int;

    static constexpr Type INVALID_VALUE = -1;

    static bool isValid(Type value) { return value >= 0; }
    static void destroy(Type value);
};

using SocketHandle = Handle<PosixHandleTraits>;
using FileHandle = Handle<PosixHandleTraits>;
using ErrorCode = int;

std::string formatError(ErrorCode errorCode);
std::string formatErrorFor(const char* func, ErrorCode errorCode);

void throwSystemError(const char* func, ErrorCode errorCode);

inline void throwIfFailed(const char* func, bool cond)
{
    if (!cond)
        throwSystemError(func, errno);
}

inline void throwIfFailed(const char *func, bool cond, ErrorCode errorCode)
{
    if (!cond)
        throwSystemError(func, errorCode);
}

}
