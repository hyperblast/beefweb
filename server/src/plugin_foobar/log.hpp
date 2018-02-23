#pragma once

#include "common.hpp"
#include "../log.hpp"

namespace msrv {
namespace plugin_foobar {

class FoobarLogger : public Logger
{
public:
    FoobarLogger();
    virtual ~FoobarLogger();
    virtual void log(LogLevel, const char*, va_list va) override;
};

}}
