#pragma once

#include <string>
#include <string.h>

namespace msrv {

#ifdef MSRV_OS_POSIX

void setLocaleCharset(const char* charset = nullptr);
std::string utf8ToLocale(const std::string& str);
std::string localeToUtf8(const std::string& str);

#endif

#ifdef MSRV_OS_WINDOWS

std::wstring utf8To16(const char* str, size_t size);

inline std::wstring utf8To16(const char* str) { return utf8To16(str, ::strlen(str)); }
inline std::wstring utf8To16(const std::string& str) { return utf8To16(str.data(), str.length()); }

std::string utf16To8(const wchar_t* str, size_t size);

inline std::string utf16To8(const wchar_t* str) { return utf16To8(str, ::wcslen(str)); }
inline std::string utf16To8(const std::wstring& str) { return utf16To8(str.data(), str.length()); }

#endif

}
