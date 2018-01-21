#pragma once

#include <chrono>

namespace msrv {

using DurationMs = std::chrono::milliseconds;
using TimePointMs = std::chrono::time_point<std::chrono::steady_clock, DurationMs>;

inline TimePointMs steadyTime()
{
    return std::chrono::time_point_cast<DurationMs>(std::chrono::steady_clock::now());
}

}
