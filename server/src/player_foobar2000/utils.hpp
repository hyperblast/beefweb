#pragma once

#include "common.hpp"
#include "../log.hpp"
#include "../work_queue.hpp"

namespace msrv {
namespace player_foobar2000 {

class FoobarLogger : public Logger
{
public:
    FoobarLogger();
    virtual ~FoobarLogger();
    virtual void log(LogLevel, const char*, va_list va) override;
};

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
