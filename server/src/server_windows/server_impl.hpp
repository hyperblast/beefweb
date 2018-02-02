#include "../server.hpp"
#include "iocp.hpp"
#include "event_loop.hpp"

#include <memory>
#include <thread>

namespace msrv {
namespace server_windows {

class ServerImpl final : public Server
{
public:
    ServerImpl();

    virtual ~ServerImpl();
    virtual void restart(const SettingsData& settings) override;
    virtual void pollEventSources() override;

private:
    void run();

    IoCompletionPort ioPort_;
    IoWorkQueue ioWorkQueue_;
    EventLoop eventLoop_;

    std::thread thread_;
};

}}
