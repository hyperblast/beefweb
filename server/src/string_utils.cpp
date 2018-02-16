#include "string_utils.hpp"

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

bool Tokenizer::hasToken(StringView value, StringView token, char sep)
{
    Tokenizer tokenizer(value, sep);

    while (tokenizer.nextToken())
    {
        if (trimWhitespace(tokenizer.token()) == token)
            return true;
    }

    return false;
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

}
