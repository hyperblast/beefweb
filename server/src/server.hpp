#pragma once

#include "defines.hpp"
#include "chrono.hpp"
#include "boost_locks_compat.hpp"

#include <functional>
#include <memory>
#include <thread>
#include <mutex>
#include <condition_variable>

namespace msrv {

class WorkQueue;
class Server;
class Router;
class SettingsData;
class RequestFilterChain;

using ServerPtr = std::shared_ptr<Server>;

struct ServerConfig
{
    bool allowRemote;
    int port;
    const Router* router;
    const RequestFilterChain* filters;
    WorkQueue* defaultWorkQueue;
};

class Server
{
public:
    static DurationMs pingEventPeriod() { return std::chrono::seconds(15); }
    static DurationMs eventDispatchDelay() { return DurationMs(20); }

    static ServerPtr create(const ServerConfig* config);

    Server() = default;
    virtual ~Server();

    virtual void run() = 0;
    virtual void exit() = 0;
    virtual void dispatchEvents() = 0;

private:
    MSRV_NO_COPY_AND_ASSIGN(Server);
};

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
