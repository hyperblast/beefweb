#include "plugin.hpp"
#include "../project_info.hpp"
#include "log.hpp"
#include <memory>

namespace msrv {
namespace plugin_foobar {

Plugin::Plugin()
    : workQueue_(std::make_shared<FoobarWorkQueue>()),
      player_(),
      host_(&player_)
{
    current_ = this;
    applySettings();
}

Plugin::~Plugin()
{
    current_ = nullptr;
}

Plugin* Plugin::current_ = nullptr;

namespace {

class InitQuit : public initquit
{
public:
    void on_init() override
    {
        Logger::setCurrent(&logger_);
        tryCatchLog([this] { plugin_ = std::make_unique<Plugin>(); });
    }

    void on_quit() override
    {
        tryCatchLog([this] { plugin_.reset(); });
        Logger::setCurrent(nullptr);
    }

private:
    FoobarLogger logger_;
    std::unique_ptr<Plugin> plugin_;
};

initquit_factory_t<InitQuit> InitQuitFactory;

DECLARE_COMPONENT_VERSION(
    MSRV_PROJECT_ID,
    MSRV_VERSION_STRING,
    MSRV_PROJECT_DESC "\n\n" MSRV_PROJECT_URL "\n\n" MSRV_LICENSE_TEXT);

VALIDATE_COMPONENT_FILENAME("foo_beefweb.dll");

}

}}
