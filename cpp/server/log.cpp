#include "log.hpp"
#include "project_info.hpp"

namespace msrv {

Logger* Logger::current_;

#ifndef NDEBUG

void logDebug(const char* fmt, ...)
{
    va_list va;
    va_start(va, fmt);

    if (auto logger = Logger::getCurrent())
        logger->log(LogLevel::L_DEBUG, fmt, va);

    va_end(va);
}

#endif

void logInfo(const char* fmt, ...)
{
    va_list va;
    va_start(va, fmt);

    if (auto logger = Logger::getCurrent())
        logger->log(LogLevel::L_INFO, fmt, va);

    va_end(va);
}

void logError(const char* fmt, ...)
{
    va_list va;
    va_start(va, fmt);

    if (auto logger = Logger::getCurrent())
        logger->log(LogLevel::L_ERROR, fmt, va);

    va_end(va);
}

StderrLogger::StderrLogger()
    : prefix_(MSRV_PROJECT_ID ": ")
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
