#include "charset.hpp"
#include "system.hpp"
#include "safe_windows.h"

namespace msrv {

namespace {

size_t convert8To16(const char* inBuffer, size_t inSize, wchar_t* outBuffer, size_t outSize)
{
    auto ret = ::MultiByteToWideChar(
        CP_UTF8,
        MB_ERR_INVALID_CHARS,
        inBuffer,
        static_cast<int>(inSize),
        outBuffer,
        static_cast<int>(outSize));

    throwIfFailed("MultiByteToWideChar", ret != 0);
    return static_cast<size_t>(ret);
}

size_t convert16To8(const wchar_t* inBuffer, size_t inSize, char* outBuffer, size_t outSize)
{
    auto ret = ::WideCharToMultiByte(
        CP_UTF8,
        WC_ERR_INVALID_CHARS,
        inBuffer,
        static_cast<int>(inSize),
        outBuffer,
        static_cast<int>(outSize),
        nullptr,
        nullptr);

    throwIfFailed("WideCharToMultiByte", ret != 0);
    return static_cast<size_t>(ret);
}

}

std::wstring utf8To16(const char* str, size_t size)
{
    std::wstring result;

    if (size == 0)
        return result;

    result.resize(convert8To16(str, size, nullptr, 0));
    convert8To16(str, size, result.data(), result.length());
    return result;
}

std::string utf16To8(const wchar_t* str, size_t size)
{
    std::string result;

    if (size == 0)
        return result;

    result.resize(convert16To8(str, size, nullptr, 0));
    convert16To8(str, size, result.data(), result.length());
    return result;
}

}
