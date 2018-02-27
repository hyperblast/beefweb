#include "work_queue.hpp"
#include "common.hpp"

namespace msrv {
namespace player_foobar2000 {

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
