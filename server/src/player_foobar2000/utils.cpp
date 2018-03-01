#include "utils.hpp"
#include "../project_info.hpp"

namespace msrv {
namespace player_foobar2000 {

FoobarLogger::FoobarLogger() = default;
FoobarLogger::~FoobarLogger() = default;

void FoobarLogger::log(LogLevel, const char* fmt, va_list va)
{
    std::string format(MSRV_PROJECT_ID);

    format.append(": ");
    format.append(fmt);

    console::printfv(format.c_str(), va);
}


FoobarWorkQueue::FoobarWorkQueue() = default;
FoobarWorkQueue::~FoobarWorkQueue() = default;

void FoobarWorkQueue::schedule()
{
    std::weak_ptr<FoobarWorkQueue> thisPtr = shared_from_this();

    fb2k::inMainThread([thisPtr]
    {
        if (auto queue = thisPtr.lock())
            queue->execute();
    });
}  

}}
