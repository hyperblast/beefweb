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
    ServerImpl(const ServerConfig* config);

    virtual ~ServerImpl();
    virtual void run() override;
    virtual void exit() override;
    virtual void dispatchEvents() override;

private:
    IoCompletionPort ioPort_;
    IoWorkQueue ioWorkQueue_;
    EventLoop eventLoop_;
    ServerConfig config_;
};

}}
