#include "util.hpp"

#include <stdarg.h>

namespace msrv {

StringView trim(StringView str, char ch)
{
    auto data = str.data();
    auto length = str.length();

    while (length > 0 && data[0] == ch)
    {
        data++;
        length--;
    }

    while (length > 0 && data[length - 1] == ch)
    {
        length--;
    }

    return StringView(data, length);
}

StringView trimWhitespace(StringView str)
{
    auto data = str.data();
    auto length = str.length();

    while (length > 0 && data[0] <= ' ')
    {
        data++;
        length--;
    }

    while (length > 0 && data[length - 1] <= ' ')
    {
        length--;
    }

    return StringView(data, length);
}

bool Tokenizer::nextToken()
{
    if (input_.empty())
        return false;

    auto pos = input_.find(sep_);

    if (pos != StringView::npos)
    {
        token_ = input_.substr(0, pos);
        input_ = input_.substr(pos + 1);
    }
    else
    {
        token_ = input_;
        input_ = StringView();
    }

    return true;
}

InvalidRequestException::~InvalidRequestException() = default;

static int parseHexDigit(int ch)
{
    if (ch >= '0' && ch <= '9')
        return ch - '0';
    if (ch >= 'a' && ch <= 'f')
        return ch - 'a' + 10;
    if (ch >= 'A' && ch <= 'F')
        return ch - 'A' + 10;
    return -1;
}

bool tryUnescapeUrl(StringView str, std::string& outVal)
{
    int state = 0;
    int first = 0;
    int second = 0;

    std::string result;

    for (size_t i = 0; i < str.length(); i++)
    {
        switch (state)
        {
        case 0:
            if (str[i] == '%')
                state = 1;
            else
                result.push_back(str[i]);
            continue;

        case 1:
            first = parseHexDigit(str[i]);
            if (first < 0)
                return false;
            state = 2;
            continue;

        case 2:
            second = parseHexDigit(str[i]);
            if (second < 0)
                return false;
            result.push_back((char)((first << 4) | second));
            state = 0;
            continue;
        }
    }

    outVal = std::move(result);

    return true;
}

std::string formatString(const char* fmt, ...)
{
    char buf[1024];

    va_list ap;
    va_start(ap, fmt);
    ::vsnprintf(buf, sizeof(buf), fmt, ap);
    va_end(ap);
    return std::string(buf);
}

bool Tokenizer::hasToken(StringView value, StringView token, char sep)
{
    Tokenizer tokenizer(value, sep);

    while (tokenizer.nextToken())
    {
        if (tokenizer.token() == token)
            return true;
    }

    return false;
}

}
