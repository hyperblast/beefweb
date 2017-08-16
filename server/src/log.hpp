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

    static void setCurrent(Logger* logger);

private:
    MSRV_NO_COPY_AND_ASSIGN(Logger);
};

class StderrLogger : public Logger
{
public:
    StderrLogger(const std::string& appName);
    virtual ~StderrLogger();
    virtual void log(LogLevel level, const char* fmt, va_list va) override;

private:
    std::string prefix_;

    MSRV_NO_COPY_AND_ASSIGN(StderrLogger);
};

#ifdef NDEBUG
inline void logDebug(const char*, ...) { }
#else
void logDebug(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);
#endif

void logInfo(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

void logError(const char* fmt, ...) MSRV_FORMAT_FUNC(1, 2);

template<typename Func>
bool tryCatchLog(Func func)
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
