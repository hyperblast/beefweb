#include "plugin.hpp"

#define CONF_PORT           MSRV_PROJECT_ID ".port"
#define CONF_ALLOW_REMOTE   MSRV_PROJECT_ID ".allow_remote"
#define CONF_MUSIC_DIRS     MSRV_PROJECT_ID ".music_dirs"
#define CONF_AUTH_REQUIRED  MSRV_PROJECT_ID ".auth_required"
#define CONF_AUTH_USER      MSRV_PROJECT_ID ".auth_user"
#define CONF_AUTH_PASSWORD  MSRV_PROJECT_ID ".auth_password"

namespace msrv::player_deadbeef {

DB_misc_t PluginWrapper::definition_;
DeadbeefLogger* PluginWrapper::logger_;
Plugin* PluginWrapper::instance_;

char PluginWrapper::licenseText_[] = MSRV_LICENSE_TEXT;

const char PluginWrapper::configDialog_[] =
    "property \"Network port\" entry " CONF_PORT " " MSRV_STRINGIFY(MSRV_DEFAULT_PORT) ";"
    "property \"Allow remote connections\" checkbox " CONF_ALLOW_REMOTE " 1;"
    "property \"Music directories\" entry " CONF_MUSIC_DIRS " \"\";"
    "property \"Require authentication\" checkbox " CONF_AUTH_REQUIRED " 0;"
    "property \"User\" entry " CONF_AUTH_USER " \"\";"
    "property \"Password\" password " CONF_AUTH_PASSWORD " \"\";";

Plugin::Plugin()
    : player_(),
      host_(&player_)
{
}

Plugin::~Plugin() = default;

void Plugin::handleConfigChanged()
{
    if (pluginsLoaded_ && refreshSettings())
        reconfigure();
}

void Plugin::handlePluginsLoaded()
{
    pluginsLoaded_ = true;
    refreshSettings();
    reconfigure();
}

void Plugin::reconfigure()
{
    auto settings = std::make_shared<SettingsData>();

    settings->port = port_;
    settings->allowRemote = allowRemote_;
    settings->musicDirs = parseValueList<std::string>(musicDirs_, ';');
    settings->authRequired = authRequired_;
    settings->authUser = authUser_;
    settings->authPassword = authPassword_;

    settings->loadAll("deadbeef");

    host_.reconfigure(std::move(settings));
}

bool Plugin::refreshSettings()
{
    ConfigMutex mutex;
    ConfigLockGuard lock(mutex);

    auto port = ddbApi->conf_get_int(CONF_PORT, MSRV_DEFAULT_PORT);
    auto allowRemote = ddbApi->conf_get_int(CONF_ALLOW_REMOTE, 1) != 0;
    auto musicDirs = ddbApi->conf_get_str_fast(CONF_MUSIC_DIRS, "");
    auto authRequired = ddbApi->conf_get_int(CONF_AUTH_REQUIRED, 0) != 0;
    auto authUser = ddbApi->conf_get_str_fast(CONF_AUTH_USER, "");
    auto authPassword = ddbApi->conf_get_str_fast(CONF_AUTH_PASSWORD, "");

    if (port_ == port &&
        allowRemote_ == allowRemote &&
        musicDirs_ == musicDirs &&
        authRequired_ == authRequired &&
        authUser_ == authUser &&
        authPassword_ == authPassword)
    {
        return false;
    }

    port_ = port;
    allowRemote_ = allowRemote;
    musicDirs_ = musicDirs;
    authRequired_ = authRequired;
    authUser_ = authUser;
    authPassword_ = authPassword;

    return true;
}

void Plugin::handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2)
{
    switch (id)
    {
    case DB_EV_CONFIGCHANGED:
        handleConfigChanged();
        break;

    case DB_EV_PLUGINSLOADED:
        handlePluginsLoaded();
        break;
    }

    player_.handleMessage(id, ctx, p1, p2);
}

DB_plugin_t* PluginWrapper::load(DB_functions_t* api)
{
    ddbApi = api;
    initDef();
    return &definition_.plugin;
}

void PluginWrapper::initDef()
{
    auto& p = definition_.plugin;

    if (p.api_vmajor)
        return;

    formatText(licenseText_, 60);

    p.api_vmajor = 1;
    p.api_vminor = DDB_API_LEVEL;
    p.version_major = MSRV_VERSION_MAJOR;
    p.version_minor = MSRV_VERSION_MINOR;
    p.type = DB_PLUGIN_MISC;
    p.id = MSRV_PROJECT_ID;
    p.name = MSRV_PROJECT_NAME;
    p.descr = MSRV_PROJECT_DESC "\n\n" MSRV_VERSION_STRING_DETAILED;
    p.copyright = licenseText_;
    p.website = MSRV_PROJECT_URL;
    p.start = start;
    p.stop = stop;
    p.connect = connect;
    p.disconnect = disconnect;
    p.message = handleMessage;
    p.configdialog = configDialog_;
    p.flags = DDB_PLUGIN_FLAG_LOGGING;
}

int PluginWrapper::start()
{
    auto ok = tryCatchLog([]
    {
        logger_ = new DeadbeefLogger(&definition_.plugin);
        Logger::setCurrent(logger_);
        setLocaleCharset();
        instance_ = new Plugin();
    });

    if (ok)
        return 0;

    stop();
    return -1;
}

int PluginWrapper::stop()
{
    if (instance_)
    {
        tryCatchLog([] { delete instance_; });
        instance_ = nullptr;
    }

    if (logger_)
    {
        Logger::setCurrent(nullptr);
        tryCatchLog([] { delete logger_; });
        logger_ = nullptr;
    }

    return 0;
}

int PluginWrapper::connect()
{
    return tryCatchLog([] { instance_->connect(); }) ? 0 : -1;
}

int PluginWrapper::disconnect()
{
    return tryCatchLog([] { instance_->disconnect(); }) ? 0 : -1;
}

int PluginWrapper::handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2)
{
    return tryCatchLog([&] { instance_->handleMessage(id, ctx, p1, p2); }) ? 0 : -1;
}

extern "C" DB_plugin_t* MSRV_DEADBEEF_ENTRY(DB_functions_t* api)
{
    return PluginWrapper::load(api);
}

}
