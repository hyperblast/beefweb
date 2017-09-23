#pragma once

#include "defines.hpp"

#include <assert.h>

#include <stdint.h>
#include <string.h>

#include <stdexcept>
#include <vector>
#include <string>
#include <sstream>
#include <memory>

namespace msrv {

class StringSegment;

enum class Switch
{
    FALSE,
    TRUE,
    TOGGLE
};

struct Range
{
    Range() = default;

    Range(int32_t offsetVal, int32_t countVal = 1)
        : offset(offsetVal), count(countVal) { }

    int32_t offset;
    int32_t count;
};

class StringSegment
{
public:
    StringSegment()
        : data_(""), length_(0) { }

    explicit StringSegment(const char* data)
        : data_(data), length_(strlen(data)) { }

    StringSegment(const char* data, size_t size)
        : data_(data), length_(size) { }

    StringSegment(const std::string& str)
        : data_(str.c_str()), length_(str.length()) { }

    const char* data() const { return data_; }

    size_t length() const { return length_; }

    explicit operator bool() const { return length_ != 0; }

    const char& operator[](size_t index) const
    {
        return data_[index];
    }

    bool operator==(const StringSegment& other) const
    {
        return length_ == other.length_
            && ::memcmp(data_, other.data_, length_) == 0;
    }

    bool operator!=(const StringSegment& other) const
    {
        return !(*this == other);
    }

    std::string toString() const
    {
        return std::string(data_, length_);
    }

    std::string toString(size_t offset) const
    {
        assert(offset <= length_);
        return std::string(data_ + offset, length_ - offset);
    }

    std::string toString(size_t offset, size_t count) const
    {
        assert(offset + count <= length_);
        return std::string(data_ + offset, count);
    }

    void trim(char ch);

    void trimWhitespace();

    const char* find(char ch) const;

    StringSegment nextToken(char sep);

private:
    const char* data_;
    size_t length_;
};

class InvalidRequestException : public std::runtime_error
{
public:
    InvalidRequestException()
        : std::runtime_error("invalid request") { }

    InvalidRequestException(const std::string& str)
        : std::runtime_error(str) { }

    ~InvalidRequestException();
};

template<typename T>
struct MallocDeleter
{
    void operator()(T* ptr) { ::free(ptr); }
};

template<typename T>
using MallocPtr = std::unique_ptr<T, MallocDeleter<T>>;

template<typename T>
std::string toString(const T& value)
{
    std::stringstream stream;
    stream << value;
    return stream.str();
}

std::string formatString(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

bool tryUnescapeUrl(const StringSegment& segment, std::string& outVal);

}
