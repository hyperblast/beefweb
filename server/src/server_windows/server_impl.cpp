#include "../server.hpp"

namespace msrv {
namespace server_windows {

class ServerImpl : public Server
{
public:
    ServerImpl();

    virtual ~ServerImpl();
    virtual void restart(const SettingsData& settings) override;
    virtual void pollEventSources() override;
};

}}
