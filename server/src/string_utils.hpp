#pragma once

#include "defines.hpp"

#include <string>
#include <sstream>

#include <boost/utility/string_view.hpp>

namespace msrv {

using StringView = boost::string_view;

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
    std::ostringstream stream;
    stream << value;
    return stream.str();
}

std::string formatString(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

StringView trim(StringView str, char ch);
StringView trimWhitespace(StringView str);

bool tryUnescapeUrl(StringView str, std::string& outVal);

}
