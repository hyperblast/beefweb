#include "server.hpp"
#include "log.hpp"

#include <boost/thread/reverse_lock.hpp>

namespace msrv {

Server::Server() = default;

Server::~Server()
{
    destroyed_.set_value();
}

ServerThread::ServerThread(ServerReadyCallback readyCallback)
    : command_(Command::NONE),
      stopPending_(false),
      readyCallback_(std::move(readyCallback))
{
    thread_ = std::thread([this] { run(); });
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
    std::lock_guard<std::mutex> lock(mutex_);

    if (server_ && !stopPending_)
        server_->dispatchEvents();
}

void ServerThread::run()
{
    UniqueLock lock(mutex_);

    while (true)
    {
        switch (command_)
        {
        case Command::NONE:
            commandNotify_.wait(lock);
            break;

        case Command::RESTART:
            command_ = Command::NONE;
            stopPending_ = false;
            runOnce(lock);
            break;

        case Command::EXIT:
            return;
        }
    }
}

void ServerThread::runOnce(UniqueLock& lock)
{
    tryCatchLog([this]
    {
        server_ = Server::create(&nextConfig_);
    });

    if (!server_)
        return;

    {
        boost::reverse_lock<UniqueLock> unlock(lock);

        if (readyCallback_)
            tryCatchLog([this] { readyCallback_(); });

        tryCatchLog([this] { server_->run(); });
    }

    auto destroyed = server_->destroyed();
    server_.reset();

    // In the case server is still doing some async work
    // and is not destroyed by the statement above wait for actual destruction.

    // This is required to prevent creating new instance while old one
    // might still be bound to ports which new instance is going to use.

    if (!destroyed.is_ready())
    {
        boost::reverse_lock<UniqueLock> unlock(lock);
        destroyed.wait();
    }
}

void ServerThread::sendCommand(Command command, const ServerConfig* nextConfig)
{
    std::lock_guard<std::mutex> lock(mutex_);

    if (command < command_)
        return;

    command_ = command;

    if (nextConfig)
        nextConfig_ = *nextConfig;

    if (server_ && !stopPending_)
    {
        server_->exit();
        stopPending_ = true;
    }

    commandNotify_.notify_all();
}

}
