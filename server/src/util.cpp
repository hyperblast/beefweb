#include "util.hpp"

#include <stdarg.h>

namespace msrv {

void StringSegment::trim(char ch)
{
    while (length_ > 0 && data_[0] == ch)
    {
        data_++;
        length_--;
    }

    while (length_ > 0 && data_[length_ - 1] == ch)
    {
        length_--;
    }
}

void StringSegment::trimWhitespace()
{
    while (length_ > 0 && data_[0] <= ' ')
    {
        data_++;
        length_--;
    }

    while (length_ > 0 && data_[length_ - 1] <= ' ')
    {
        length_--;
    }
}

const char* StringSegment::find(char ch) const
{
    for (size_t i = 0; i < length_; i++)
    {
        if (data_[i] == ch)
            return &data_[i];
    }

    return nullptr;
}

StringSegment StringSegment::nextToken(char sep)
{
    if (!(*this))
        return StringSegment();

    StringSegment head;

    auto pos = find(sep);

    if (pos)
    {
        head = StringSegment(data_, pos - data_);
        *this = StringSegment(pos + 1, length_ - head.length_ - 1);
    }
    else
    {
        head = *this;
        *this = StringSegment();
    }

    return head;
}

bool ValueParser<bool>::tryParse(StringSegment segment, bool* outVal)
{
    switch (segment.length())
    {
    case 4:
        if (::memcmp(segment.data(), "true", 4) == 0)
        {
            *outVal = true;
            return true;
        }

        return false;

    case 5:
        if (::memcmp(segment.data(), "false", 5) == 0)
        {
            *outVal = false;
            return true;
        }

        return false;

    default:
        return false;
    }
}

bool ValueParser<int32_t>::tryParse(StringSegment segment, int32_t* outVal)
{
    if (!segment)
        return false;

    auto str = segment.data();
    auto len = segment.length();

    int sign = 1;

    if (*str == '-')
    {
        str++;
        len--;
        sign = -1;

        if (len == 0)
            return false;
    }

    if (len > 10)
        return false;

    int64_t result = 0;

    for (; len > 0; (str++, len--))
    {
        if (*str > '9' || *str < '0')
            return false;

        result = 10 * result + (*str - '0');
    }

    result *= sign;

    if (result > INT32_MAX || result < INT32_MIN)
        return false;

    *outVal = static_cast<int32_t>(result);
    return true;
}

bool ValueParser<Range>::tryParse(StringSegment segment, Range* outVal)
{
    int32_t offset;
    int32_t count;

    auto str = segment.data();
    auto len = segment.length();

    auto delim = segment.find(':');

    if (!delim)
    {
        if (!tryParseValue(segment, &offset))
            return false;

        *outVal = Range(offset, 1);
        return true;
    }

    auto offsetLen = delim - str;
    auto countLen = len - offsetLen - 1;

    if (!tryParseValue(StringSegment(str, offsetLen), &offset))
        return false;

    if (!tryParseValue(StringSegment(delim + 1, countLen), &count))
        return false;

    *outVal = Range(offset, count);
    return true;
}

bool ValueParser<Switch>::tryParse(StringSegment segment, Switch* outVal)
{
    switch (segment.length())
    {
    case 4:
        if (::memcmp(segment.data(), "true", 4) == 0)
        {
            *outVal = Switch::TRUE;
            return true;
        }

        return false;

    case 5:
        if (::memcmp(segment.data(), "false", 5) == 0)
        {
            *outVal = Switch::FALSE;
            return true;
        }

        return false;

    case 6:
        if (::memcmp(segment.data(), "toggle", 6) == 0)
        {
            *outVal = Switch::TOGGLE;
            return true;
        }

        return false;

    default:
        return false;
    }
}

bool ValueParser<double>::tryParse(StringSegment segment, double* outVal)
{
    char buffer[32];

    size_t len = segment.length();

    if (len >= sizeof(buffer))
        return false;

    ::memcpy(buffer, segment.data(), len);
    buffer[len] = '\0';

    char* end;
    double value = ::strtod(buffer, &end);

    if (end != &buffer[len])
        return false;

    *outVal = value;
    return true;
}

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

bool tryUnescapeUrl(const StringSegment& segment, std::string& outVal)
{
    int state = 0;
    int first = 0;
    int second = 0;

    std::string result;

    for (size_t i = 0; i < segment.length(); i++)
    {
        switch (state)
        {
        case 0:
            if (segment[i] == '%')
                state = 1;
            else
                result.push_back(segment[i]);
            continue;

        case 1:
            first = parseHexDigit(segment[i]);
            if (first < 0)
                return false;
            state = 2;
            continue;

        case 2:
            second = parseHexDigit(segment[i]);
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

}
