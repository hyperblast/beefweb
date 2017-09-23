#pragma once

#include "util.hpp"

#include <boost/lexical_cast/try_lexical_convert.hpp>

namespace msrv {

template<typename T> struct ValueParser;

template<typename T>
bool tryParseValue(StringSegment segment, T* outVal);

template<typename T>
T parseValue(StringSegment segment);

template<typename T>
bool tryParseValueList(StringSegment segment, char sep, std::vector<T>* outVal);

template<typename T>
std::vector<T> parseValueList(StringSegment segment, char sep);

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

template<typename T>
struct ValueParser<std::vector<T>>
{
    static bool tryParse(StringSegment segment, std::vector<T>* outVal)
    {
        return tryParseValueList(segment, ',', outVal);
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

template<typename T>
std::vector<T> parseValueList(StringSegment segment, char sep)
{
    std::vector<T> result;

    if (!tryParseValueList(segment, sep, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

}
