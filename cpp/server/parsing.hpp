#pragma once

#include "string_utils.hpp"

#include <vector>
#include <boost/lexical_cast/try_lexical_convert.hpp>
#include <boost/tokenizer.hpp>

namespace msrv {

template<typename T>
struct ValueParser;

template<typename T>
bool tryParseValue(StringView str, T* outVal);

template<typename T>
bool tryParseValueList(StringView str, char sep, std::vector<T>* outVal);

template<typename T>
bool tryParseValueListStrict(StringView str, char sep, char esc, std::vector<T>* outVal);

template<typename T>
T parseValue(StringView str);

template<typename T>
std::vector<T> parseValueList(StringView str, char sep);

template<typename T>
std::vector<T> parseValueListStrict(StringView str, char sep, char esc);

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
        return tryParseValueListStrict(str, ',', '\\', outVal);
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
bool tryParseValueList(StringView str, char sep, std::vector<T>* outVal)
{
    assert(str.data());
    assert(outVal);

    auto input = str.to_string();
    char sepString[] = {sep, '\0'};

    boost::char_separator<char> separator(
        sepString,
        "",
        boost::drop_empty_tokens);

    boost::tokenizer<boost::char_separator<char>> tokenizer(input, separator);

    std::vector<T> items;

    for (const auto& token : tokenizer)
    {
        T value;

        auto trimmedToken = trimWhitespace(token);
        if (trimmedToken.empty())
            continue;

        if (!tryParseValue(trimmedToken, &value))
            return false;

        items.emplace_back(std::move(value));
    }

    *outVal = std::move(items);
    return true;
}

template<typename T>
bool tryParseValueListStrict(StringView str, char sep, char esc, std::vector<T>* outVal)
{
    assert(str.data());
    assert(outVal);

    auto input = str.to_string();

    boost::escaped_list_separator<char> separator(
        std::string(1, esc),
        std::string(1, sep),
        std::string());

    boost::tokenizer<boost::escaped_list_separator<char>> tokenizer(input, separator);

    std::vector<T> items;

    for (const auto& token : tokenizer)
    {
        T value;

        if (!tryParseValue(token, &value))
            return false;

        items.emplace_back(std::move(value));
    }

    *outVal = std::move(items);
    return true;
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
std::vector<T> parseValueList(StringView str, char sep)
{
    std::vector<T> result;

    if (!tryParseValueList(str, sep, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

template<typename T>
std::vector<T> parseValueListStrict(StringView str, char sep, char esc)
{
    std::vector<T> result;

    if (!tryParseValueListStrict(str, sep, esc, &result))
        throw std::invalid_argument("invalid value format");

    return result;
}

}
