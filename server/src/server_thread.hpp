#pragma once

#include "server.hpp"

#include "boost_locks_compat.hpp"

#include <functional>
#include <memory>
#include <thread>
#include <mutex>
#include <condition_variable>

namespace msrv {

using ServerReadyCallback = std::function<void()>;

class ServerThread
{
public:
    ServerThread(ServerReadyCallback readyCallback = ServerReadyCallback());
    ~ServerThread();

    void restart(const ServerConfig* config)
    {
        sendCommand(Command::RESTART, config);
    }

    void dispatchEvents();

private:
    using UniqueLock = BoostAwareUniqueLock<std::mutex>;

    enum class Command
    {
        NONE,
        RESTART,
        EXIT,
    };

    void run();
    void runOnce(UniqueLock& lock);
    void sendCommand(Command command, const ServerConfig* nextConfig = nullptr);

    std::thread thread_;
    std::mutex mutex_;
    std::condition_variable commandNotify_;
    ServerPtr server_;
    Command command_;
    ServerConfig nextConfig_;
    bool stopPending_;
    ServerReadyCallback readyCallback_;

    MSRV_NO_COPY_AND_ASSIGN(ServerThread);
};


}
