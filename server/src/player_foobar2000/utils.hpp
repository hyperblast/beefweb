#pragma once

#include "common.hpp"
#include "../log.hpp"
#include "../work_queue.hpp"

namespace msrv {
namespace player_foobar2000 {

class Fb2kLogger : public Logger
{
public:
    Fb2kLogger();
    virtual ~Fb2kLogger();
    virtual void log(LogLevel, const char*, va_list va) override;

private:
    std::string prefix_;
};

class Fb2kWorkQueue
    : public main_thread_callback,
      public ExternalWorkQueue
{
public:
    Fb2kWorkQueue();
    virtual ~Fb2kWorkQueue();
    virtual void callback_run() override;

protected:
    virtual void schedule() override;
};

}}
