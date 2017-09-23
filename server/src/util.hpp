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

#include <boost/lexical_cast/try_lexical_convert.hpp>

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
struct ValueParser
{
    static bool tryParse(StringSegment segment, T* outVal)
    {
        assert(segment.data());
        assert(outVal);

        return boost::conversion::try_lexical_convert(segment.data(), segment.length(), *outVal);
    }
};

template<typename T>
bool tryParseValue(StringSegment segment, T* outVal)
{
    assert(segment.data());
    assert(outVal);

    return ValueParser<T>::tryParse(segment, outVal);
}

template<typename T>
T parseValue(StringSegment segment)
{
    T result;

    if (!tryParseValue(segment, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

template<typename T>
bool tryParseValueList(StringSegment segment, char sep, std::vector<T>* outVal);

template<typename T>
std::vector<T> parseValueList(StringSegment segment, bool sep)
{
    std::vector<T> result;

    if (!tryParseValueList(segment, sep, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

bool tryUnescapeUrl(const StringSegment& segment, std::string& outVal);

template<typename T>
std::string toString(const T& value)
{
    std::stringstream stream;
    stream << value;
    return stream.str();
}

std::string formatString(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

template<>
struct ValueParser<std::string>
{
    static bool tryParse(StringSegment segment, std::string* outVal)
    {
        *outVal = segment.toString();
        return true;
    }
};

template<>
struct ValueParser<bool>
{
    static bool tryParse(StringSegment segment, bool* outVal);
};

template<>
struct ValueParser<Range>
{
    static bool tryParse(StringSegment segment, Range* outVal);
};

template<>
struct ValueParser<Switch>
{
    static bool tryParse(StringSegment segment, Switch* outVal);
};

template<typename T>
struct ValueParser<std::vector<T>>
{
    static bool tryParse(StringSegment segment, std::vector<T>* outVal)
    {
        return tryParseValueList(segment, ',', outVal);
    }
};

template<typename T>
bool tryParseValueList(StringSegment segment, char sep, std::vector<T>* outVal)
{
    assert(segment.data());
    assert(outVal);

    std::vector<T> items;

    while (auto token = segment.nextToken(sep))
    {
        token.trimWhitespace();
        if (!token)
            continue;

        T value;
        if (!tryParseValue(token, &value))
            return false;

        items.push_back(std::move(value));
    }

    *outVal = std::move(items);
    return true;
}

}
