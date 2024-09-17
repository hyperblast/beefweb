#pragma once

#include "defines.hpp"

#include <stdarg.h>
#include <exception>
#include <string>

namespace msrv {

enum class LogLevel
{
    DEBUG,
    INFO,
    ERROR
};

class Logger
{
public:
    Logger() = default;
    virtual ~Logger() = default;
    virtual void log(LogLevel, const char*, va_list va) = 0;

    static Logger* getCurrent()
    {
        return current_;
    }

    static void setCurrent(Logger* logger)
    {
        current_ = logger;
    }

private:
    static Logger* current_;

    MSRV_NO_COPY_AND_ASSIGN(Logger);
};

class StderrLogger final : public Logger
{
public:
    StderrLogger();
    virtual ~StderrLogger();
    virtual void log(LogLevel level, const char* fmt, va_list va) override;

private:
    std::string prefix_;

    MSRV_NO_COPY_AND_ASSIGN(StderrLogger);
};

class LoggerScope
{
public:
    explicit LoggerScope(Logger* logger)
        : previous_(Logger::getCurrent())
    {
        Logger::setCurrent(logger);
    }

    ~LoggerScope()
    {
        Logger::setCurrent(previous_);
    }

private:
    Logger* previous_;

    MSRV_NO_COPY_AND_ASSIGN(LoggerScope);
};

#ifdef NDEBUG
inline void logDebug(const char*, ...) { }
#else
void logDebug(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);
#endif

void logInfo(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

void logError(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

template<typename Func>
bool tryCatchLog(Func&& func)
{
    try
    {
        func();
        return true;
    }
    catch (std::exception& ex)
    {
        logError("%s", ex.what());
        return false;
    }
    catch (...)
    {
        logError("unknown error");
        return false;
    }
}

}
