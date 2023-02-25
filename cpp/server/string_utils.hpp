#pragma once

#include "defines.hpp"

#include <string>
#include <sstream>
#include <unordered_map>

#include <boost/functional/hash.hpp>
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

void formatText(char* data, size_t maxWidth);

inline char asciiToLower(char ch)
{
    return ch >= 'A' && ch <= 'Z' ? static_cast<char>(ch - 'A' + 'a') : ch;
}

struct AsciiLowerCaseHash
{
    size_t operator()(std::string const& str) const
    {
        size_t h = 0;

        for (char ch : str)
        {
            boost::hash_combine(h, asciiToLower(ch));
        }

        return h;
    }
};

struct AsciiLowerCaseEqual
{
    bool operator()(std::string const& s1, std::string const& s2) const
    {
        if (s1.size() != s2.size())
        {
            return false;
        }

        for (size_t i = 0; i < s1.size(); i++)
        {
            if (asciiToLower(s1[i]) != asciiToLower(s2[i]))
            {
                return false;
            }
        }

        return true;
    }
};

template<typename T>
using AsciiLowerCaseMap = std::unordered_map<std::string, T, AsciiLowerCaseHash, AsciiLowerCaseEqual>;

}
