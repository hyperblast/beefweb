#include "log.hpp"

namespace msrv {

namespace {
Logger* currentLogger;
}

#ifndef NDEBUG

void logDebug(const char* fmt, ...)
{
    va_list va;
    va_start(va, fmt);

    if (currentLogger)
        currentLogger->log(LogLevel::DEBUG, fmt, va);

    va_end(va);
}

#endif

void logInfo(const char* fmt, ...)
{
    va_list va;
    va_start(va, fmt);

    if (currentLogger)
        currentLogger->log(LogLevel::INFO, fmt, va);

    va_end(va);
}

void logError(const char* fmt, ...)
{
    va_list va;
    va_start(va, fmt);

    if (currentLogger)
        currentLogger->log(LogLevel::ERROR, fmt, va);

    va_end(va);
}

void Logger::setCurrent(Logger* logger)
{
    currentLogger = logger;
}

StderrLogger::StderrLogger(const std::string& appName)
    : prefix_(appName + ": ")
{
}

StderrLogger::~StderrLogger()
{
}

void StderrLogger::log(LogLevel, const char* fmt, va_list va)
{
    std::string format = prefix_ + fmt + "\n";

    ::vfprintf(stderr, format.c_str(), va);
}

}
