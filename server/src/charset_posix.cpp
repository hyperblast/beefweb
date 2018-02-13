#include "charset.hpp"
#include "system.hpp"
#include "log.hpp"

#include <stdexcept>

#include <string.h>
#include <langinfo.h>
#include <iconv.h>

namespace msrv {

namespace {

const char utf8Charset[] = "UTF-8";
char localeCharset[64] = "UTF-8";
bool localeCharsetIsUtf8 = true;

class Iconv
{
public:
    Iconv(const char* from, const char* to)
    {
        conv_ = ::iconv_open(to, from);
        throwIfFailed("iconv_open", isValid(conv_));
    }

    ~Iconv()
    {
        if (isValid(conv_))
            ::iconv_close(conv_);
    }

    std::string convert(const char* buf, size_t size);

private:
    bool isValid(::iconv_t conv)
    {
        return reinterpret_cast<intptr_t>(conv) != static_cast<intptr_t>(-1);
    }

    ::iconv_t conv_;

    MSRV_NO_COPY_AND_ASSIGN(Iconv);
};

std::string Iconv::convert(const char* buf, size_t size)
{
    std::string out;
    out.resize(size);

    char* inPtr = const_cast<char*>(buf);
    size_t inSize = size;

    char* outPtr = &out[0];
    size_t outSize = out.length();

    while (true)
    {
        size_t size = ::iconv(conv_, &inPtr, &inSize, &outPtr, &outSize);

        if (size == static_cast<size_t>(-1))
        {
            if (errno == E2BIG)
            {
                size_t currentOffset = static_cast<size_t>(outPtr - &out[0]);
                size_t sizeIncrement = out.length();

                out.resize(out.length() + sizeIncrement);
                outPtr = &out[currentOffset];
                outSize += sizeIncrement;
                continue;
            }

            throwSystemError("iconv", errno);
        }

        if (inSize > 0)
            throw std::runtime_error("Malformed input string");

        out.resize(static_cast<size_t>(outPtr - &out[0]));
        return out;
    }
}

}

void setLocaleCharset(const char* charset)
{
    if (charset == nullptr)
    {
        charset = ::nl_langinfo(CODESET);

        if (charset == nullptr || charset[0] == '\0')
            throw std::runtime_error("Failed to obtain current locale charset");
    }

    if (::strlen(charset) >= sizeof(localeCharset))
        throw std::runtime_error("Charset name is too long");

    ::strcpy(localeCharset, charset);
    localeCharsetIsUtf8 = ::strcmp(charset, utf8Charset) == 0;
    logDebug("locale charset is %s", charset);
}

std::string utf8ToLocale(const std::string& str)
{
    if (str.empty() || localeCharsetIsUtf8)
        return str;

    return Iconv(utf8Charset, localeCharset).convert(str.data(), str.length());
}

std::string localeToUtf8(const std::string& str)
{
    if (str.empty() || localeCharsetIsUtf8)
        return str;

    return Iconv(localeCharset, utf8Charset).convert(str.data(), str.length());
}

}
