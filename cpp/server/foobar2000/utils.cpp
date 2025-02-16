#include "utils.hpp"
#include "../project_info.hpp"

namespace msrv {
namespace player_foobar2000 {

boost::optional<GUID> tryParseGuid(const char* str)
{
    auto result = pfc::GUID_from_text(str);

    if (result != pfc::guid_null || strcmp(str, "00000000-0000-0000-0000-000000000000") == 0)
        return result;

    return boost::none;
}

boost::optional<std::pair<GUID, GUID>> tryParseDoubleGuid(const char* str)
{
    auto sep = strchr(str, ':');
    if (!sep)
        return boost::none;

    char firstStr[37]; // 32 hex chars + 4 separators + 1 null terminator

    auto firstLen = sep - str;
    if (firstLen + 1 > sizeof(firstStr))
        return boost::none;

    memcpy(firstStr, str, firstLen);
    firstStr[firstLen] = '\0';

    auto secondStr = sep + 1;

    auto firstGuid = tryParseGuid(firstStr);
    auto secondGuid = tryParseGuid(secondStr);

    if (firstGuid && secondGuid)
        return std::make_pair(firstGuid.get(), secondGuid.get());

    return boost::none;
}

std::string doubleGuidToString(const GUID& guid1, const GUID& guid2)
{
    auto str1 = pfc::print_guid(guid1);
    auto str2 = pfc::print_guid(guid2);

    std::string result;
    result.reserve(str1.length() + str2.length() + 1);
    result.append(str1.c_str(), str1.length());
    result.append(":", 1);
    result.append(str2.c_str(), str2.length());
    return result;
}

service_factory_single_t<PlayQueueEventAdapter> playQueueEventAdapterFactory;

Fb2kLogger::Fb2kLogger()
    : prefix_(MSRV_PROJECT_ID ": ")
{
}

void Fb2kLogger::log(LogLevel, const char* fmt, va_list va)
{
    console::printfv((prefix_ + fmt).c_str(), va);
}

void Fb2kWorkQueue::schedule(WorkCallback callback)
{
    fb2k::inMainThread(std::move(callback));
}

}
}
