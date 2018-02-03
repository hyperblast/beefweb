#pragma once

#include <mutex>
#include <boost/thread/lock_options.hpp>

namespace msrv {

template<typename T>
class BoostAwareUniqueLock : public std::unique_lock<T>
{
public:
    explicit BoostAwareUniqueLock(T& lock)
        : std::unique_lock<T>(lock) { }

    BoostAwareUniqueLock(T& lock, boost::adopt_lock_t)
        : std::unique_lock<T>(lock, std::adopt_lock) { }
};

}
