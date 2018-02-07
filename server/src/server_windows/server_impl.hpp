#include "../server.hpp"
#include "iocp.hpp"
#include "event_loop.hpp"
#include "http_server.hpp"

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
    static std::wstring getUrlPrefix(const ServerConfig* config);

    IoCompletionPort ioPort_;
    IoWorkQueue ioWorkQueue_;
    EventLoop eventLoop_;
    HttpServer http_;
    ServerConfig config_;
};

}}
