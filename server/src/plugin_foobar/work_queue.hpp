#pragma once

#include "../work_queue.hpp"
#include <memory>

namespace msrv {
namespace plugin_foobar {

class FoobarWorkQueue
    : public ExternalWorkQueue,
      public std::enable_shared_from_this<FoobarWorkQueue>
{
public:
    FoobarWorkQueue();
    virtual ~FoobarWorkQueue();

protected:
    virtual void schedule() override;
};

}}
