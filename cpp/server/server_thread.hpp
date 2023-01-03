#pragma once

#include "server.hpp"

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

    void restart(ServerConfigPtr config)
    {
        sendCommand(Command::RESTART, std::move(config));
    }

    void dispatchEvents();

private:
    enum class Command
    {
        NONE,
        RESTART,
        EXIT,
    };

    Command readCommand(ServerConfigPtr* config);
    void run();
    void runOnce(ServerConfigPtr config);
    void sendCommand(Command command, ServerConfigPtr nextConfig = ServerConfigPtr());

    std::thread thread_;
    std::mutex mutex_;
    std::condition_variable commandNotify_;
    ServerPtr server_;
    Command command_;
    ServerConfigPtr nextConfig_;
    ServerReadyCallback readyCallback_;

    MSRV_NO_COPY_AND_ASSIGN(ServerThread);
};


}
