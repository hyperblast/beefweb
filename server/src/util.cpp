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
