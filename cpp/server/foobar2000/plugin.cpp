#include "plugin.hpp"
#include "settings.hpp"
#include "../project_info.hpp"
#include "utils.hpp"

#include <memory>

namespace msrv {
namespace player_foobar2000 {

Plugin::Plugin()
    : player_(),
      host_(&player_)
{
    assert(!current_);
    reconfigure();
    current_ = this;
}

Plugin::~Plugin()
{
    current_ = nullptr;
}

void Plugin::reconfigure()
{
    auto settings = std::make_shared<SettingsData>();

    settings->port = SettingVars::port;
    settings->allowRemote = SettingVars::allowRemote;
    settings->musicDirs = SettingVars::getMusicDirs();
    settings->authRequired = SettingVars::authRequired;
    settings->authUser = SettingVars::authUser;
    settings->authPassword = SettingVars::authPassword;

    settings->loadAll("foobar2000");

    host_.reconfigure(std::move(settings));
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
    Fb2kLogger logger_;
    std::unique_ptr<Plugin> plugin_;
};

initquit_factory_t<InitQuit> InitQuitFactory;

#if MSRV_VERSION_FINAL
#define VERSION_SUFFIX
#else
#define VERSION_SUFFIX " alpha"
#endif

DECLARE_COMPONENT_VERSION(
    MSRV_PROJECT_NAME,
    MSRV_VERSION_STRING VERSION_SUFFIX,
    MSRV_PROJECT_DESC "\n\n"
    MSRV_VERSION_STRING_DETAILED "\n\n"
    MSRV_LICENSE_TEXT
);

VALIDATE_COMPONENT_FILENAME(MSRV_FOOBAR2000_FILE);

}

}
}
