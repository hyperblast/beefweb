#include "utils.hpp"
#include "project_info.hpp"

namespace msrv::player_foobar2000 {

namespace prefs_pages {

// {69188A07-E885-462D-81B0-819768D56C06}
const GUID main = {0x69188a07, 0xe885, 0x462d, {0x81, 0xb0, 0x81, 0x97, 0x68, 0xd5, 0x6c, 0x6}};

// {49B5E18A-5708-4C3B-ABEF-389D1A082E5D}
const GUID permissions = {0x49b5e18a, 0x5708, 0x4c3b, {0xab, 0xef, 0x38, 0x9d, 0x1a, 0x8, 0x2e, 0x5d}};

}

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
    if (static_cast<size_t>(firstLen) + 1 > sizeof(firstStr))
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
