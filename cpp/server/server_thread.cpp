#include "server_thread.hpp"
#include "log.hpp"
#include "project_info.hpp"

#include <boost/thread/reverse_lock.hpp>

namespace msrv {

ServerThread::ServerThread(ServerReadyCallback readyCallback)
    : command_(Command::NONE),
      readyCallback_(std::move(readyCallback))
{
    thread_ = std::thread([this] {
        setThreadName(MSRV_THREAD_NAME("server"));
        run();
    });
}

ServerThread::~ServerThread()
{
    if (thread_.joinable())
    {
        sendCommand(Command::EXIT);
        thread_.join();
    }
}

void ServerThread::dispatchEvents()
{
    ServerPtr server;

    {
        std::lock_guard<std::mutex> lock(mutex_);
        server = server_;
    }

    if (server)
        server->dispatchEvents();
}

ServerThread::Command ServerThread::readCommand(ServerConfigPtr* config)
{
    std::unique_lock<std::mutex> lock(mutex_);

    while (command_ == Command::NONE)
        commandNotify_.wait(lock);

    auto command = command_;
    command_ = Command::NONE;
    *config = std::move(nextConfig_);
    return command;
}

void ServerThread::run()
{
    ServerConfigPtr config;

    while (true)
    {
        switch (readCommand(&config))
        {
        case Command::NONE:
            continue;

        case Command::RESTART:
            runOnce(std::move(config));
            break;

        case Command::EXIT:
            return;
        }
    }
}

void ServerThread::runOnce(ServerConfigPtr config)
{
    ServerPtr server;

    tryCatchLog([&config, &server] {
        server = std::make_shared<Server>(ServerCore::create(), std::move(config));
    });

    if (!server)
        return;

    {
        std::lock_guard<std::mutex> lock(mutex_);

        if (command_ != Command::NONE)
            return;

        server_ = server;
    }

    if (readyCallback_)
        tryCatchLog([this] { readyCallback_(); });

    tryCatchLog([&server] { server->run(); });

    {
        std::lock_guard<std::mutex> lock(mutex_);
        server_.reset();
    }

    auto destroyed = server->destroyed();
    server.reset();

    // In the case server is still doing some async work
    // and is not destroyed by the statement above wait for actual destruction.

    // This is required to prevent creating new instance while old one
    // might still be bound to ports which new instance is going to use.

    destroyed.wait();
}

void ServerThread::sendCommand(Command command, ServerConfigPtr nextConfig)
{
    ServerPtr server;

    {
        std::lock_guard<std::mutex> lock(mutex_);

        if (command < command_)
            return;

        command_ = command;
        nextConfig_ = std::move(nextConfig);

        server = std::move(server_);
        commandNotify_.notify_all();
    }

    if (server)
        server->exit();
}

}
