#include "plugin.hpp"
#include "settings.hpp"
#include "project_info.hpp"
#include "utils.hpp"

#include <memory>

namespace msrv::player_foobar2000 {

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

Path Plugin::getProfileDir()
{
    const char* path = core_api::get_profile_path();

    if (strncmp(path, "file://", 7) == 0)
        path = path + 7;

    return pathFromUtf8(path);
}

void Plugin::reconfigure()
{
    auto settings = std::make_shared<SettingsData>();

    settings->port = settings_store::port;
    settings->allowRemote = settings_store::allowRemote;
    settings->musicDirsStr = settings_store::getMusicDirs();
    settings->authRequired = settings_store::authRequired;
    settings->authUser = settings_store::authUser;
    settings->authPassword = settings_store::authPassword;
    settings->permissions = settings_store::getPermissions();

    settings->initialize(getProfileDir());

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
        SettingsData::migrate(MSRV_PLAYER_FOOBAR2000, Plugin::getProfileDir());
        tryCatchLog([this] { plugin_ = std::make_unique<Plugin>(); });
    }

    void on_quit() override
    {
        plugin_.reset();
        Logger::setCurrent(nullptr);
    }

private:
    Fb2kLogger logger_;
    std::unique_ptr<Plugin> plugin_;
};

initquit_factory_t<InitQuit> InitQuitFactory;

DECLARE_COMPONENT_VERSION(
    MSRV_PROJECT_NAME,
    MSRV_VERSION_STRING MSRV_VERSION_SUFFIX,
    MSRV_PROJECT_DESC "\n\n"
    MSRV_VERSION_STRING_DETAILED "\n\n"
    MSRV_LICENSE_TEXT
);

VALIDATE_COMPONENT_FILENAME(MSRV_FOOBAR2000_PLUGIN_FILE);

}

}
