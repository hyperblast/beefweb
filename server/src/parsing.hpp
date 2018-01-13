#pragma once

#include "string_utils.hpp"

#include <vector>
#include <boost/lexical_cast/try_lexical_convert.hpp>

namespace msrv {

template<typename T> struct ValueParser;

template<typename T>
bool tryParseValue(StringView str, T* outVal);

template<typename T>
T parseValue(StringView str);

template<typename T>
bool tryParseValueList(StringView str, char sep, std::vector<T>* outVal);

template<typename T>
std::vector<T> parseValueList(StringView str, char sep);

template<typename T>
struct ValueParser
{
    static bool tryParse(StringView str, T* outVal)
    {
        assert(str.data());
        assert(outVal);

        return boost::conversion::try_lexical_convert(str.data(), str.length(), *outVal);
    }
};

template<>
struct ValueParser<std::string>
{
    static bool tryParse(StringView str, std::string* outVal)
    {
        *outVal = str.to_string();
        return true;
    }
};

template<>
struct ValueParser<bool>
{
    static bool tryParse(StringView str, bool* outVal);
};

template<typename T>
struct ValueParser<std::vector<T>>
{
    static bool tryParse(StringView str, std::vector<T>* outVal)
    {
        return tryParseValueList(str, ',', outVal);
    }
};

template<typename T>
bool tryParseValue(StringView str, T* outVal)
{
    assert(str.data());
    assert(outVal);

    return ValueParser<T>::tryParse(str, outVal);
}

template<typename T>
T parseValue(StringView str)
{
    T result;

    if (!tryParseValue(str, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

template<typename T>
bool tryParseValueList(StringView str, char sep, std::vector<T>* outVal)
{
    assert(str.data());
    assert(outVal);

    std::vector<T> items;

    Tokenizer tokenizer(str, sep);

    while (tokenizer.nextToken())
    {
        auto token = trimWhitespace(tokenizer.token());

        if (token.empty())
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
std::vector<T> parseValueList(StringView str, char sep)
{
    std::vector<T> result;

    if (!tryParseValueList(str, sep, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

}
