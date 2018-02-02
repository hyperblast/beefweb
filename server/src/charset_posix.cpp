#include "charset.hpp"

namespace msrv {

void initLocaleCharset(const char*)
{
}

std::string utf8ToLocale(const std::string& str)
{
    return str;
}

std::string localeToUtf8(const std::string& str)
{
    return str;
}

} 
