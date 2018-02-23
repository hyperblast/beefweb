#include "log.hpp"
#include "../project_info.hpp"

namespace msrv {
namespace plugin_foobar {

FoobarLogger::FoobarLogger() = default;
FoobarLogger::~FoobarLogger() = default;

void FoobarLogger::log(LogLevel, const char* fmt, va_list va)
{
    std::string format(MSRV_PROJECT_ID);

    format.append(": ");
    format.append(fmt);

    console::printfv(format.c_str(), va);
}

}}
