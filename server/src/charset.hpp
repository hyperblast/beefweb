#pragma once

#include <string>

namespace msrv {

#ifdef MSRV_OS_POSIX

void setLocaleCharset(const char* charset = nullptr);
std::string utf8ToLocale(const std::string& str);
std::string localeToUtf8(const std::string& str);

#endif

#ifdef MSRV_OS_WINDOWS

std::wstring utf8To16(const std::string& str);
std::string utf16To8(const std::wstring& str);

#endif

}
