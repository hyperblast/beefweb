#include "charset.hpp" 
#include "system.hpp"
#include "safe_windows.h"

namespace msrv {

namespace {

inline size_t utf16To8(const wchar_t* inBuffer, size_t inSize, char* outBuffer, size_t outSize)
{
    auto ret = ::WideCharToMultiByte(
        CP_UTF8,
        MB_ERR_INVALID_CHARS,
        inBuffer,
        static_cast<int>(inSize),
        outBuffer,
        outSize,
        nullptr,
        nullptr);

    throwIfFailed("WideCharToMultiByte", ret != 0);

    return static_cast<size_t>(ret);
}

inline size_t utf8To16(const char* inBuffer, size_t inSize, wchar_t* outBuffer, size_t outSize)
{
    auto ret = ::MultiByteToWideChar(
        CP_UTF8,
        MB_ERR_INVALID_CHARS,
        inBuffer,
        static_cast<int>(inSize),
        outBuffer,
        outSize);

    throwIfFailed("MultiByteToWideChar", ret != 0);

    return static_cast<size_t>(ret);
}

}

std::string utf16To8(const std::wstring& str)
{
    std::string result;

    if (str.empty())
        return result;

    result.resize(utf16To8(str.c_str(), str.length(), nullptr, 0));
    utf16To8(str.c_str(), str.length(), &result[0], result.length());

    return result;
}

std::wstring utf8To16(const std::string& str)
{
    std::wstring result;

    if (str.empty())
        return result;

    result.resize(utf8To16(str.c_str(), str.length(), nullptr, 0));
    utf8To16(str.c_str(), str.length(), &result[0], result.length());

    return result;
}

}
