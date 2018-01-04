#pragma once

#include "defines.hpp"

#include <stdint.h>
#include <string.h>

#include <stdexcept>
#include <vector>
#include <string>
#include <sstream>
#include <memory>

#include <boost/utility/string_view.hpp>

namespace msrv {

using StringView = boost::string_view;

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

class Tokenizer
{
public:
    Tokenizer(StringView str, char sep)
        : input_(str), sep_(sep) { }

    static bool hasToken(StringView value, StringView token, char sep);

    const StringView& token() const { return token_; }
    const StringView& input() const { return input_; }

    bool nextToken();

private:
    StringView token_;
    StringView input_;
    char sep_;
};

template<typename T>
std::string toString(const T& value)
{
    std::stringstream stream;
    stream << value;
    return stream.str();
}

std::string formatString(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

StringView trim(StringView str, char ch);
StringView trimWhitespace(StringView str);

bool tryUnescapeUrl(StringView str, std::string& outVal);

}
