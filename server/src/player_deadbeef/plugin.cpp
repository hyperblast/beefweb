#include "plugin.hpp"
#include "../log.hpp"
#include "../project_info.hpp"
#include "../charset.hpp"

#define CONF_PORT           MSRV_PROJECT_ID ".port"
#define CONF_ALLOW_REMOTE   MSRV_PROJECT_ID ".allow_remote"
#define CONF_MUSIC_DIRS     MSRV_PROJECT_ID ".music_dirs"
#define CONF_AUTH_REQUIRED  MSRV_PROJECT_ID ".auth_required"
#define CONF_AUTH_USER      MSRV_PROJECT_ID ".auth_user"
#define CONF_AUTH_PASSWORD  MSRV_PROJECT_ID ".auth_password"

namespace msrv {
namespace player_deadbeef {

DB_misc_t PluginWrapper::definition_;
Plugin*  PluginWrapper::instance_;

const char PluginWrapper::configDialog_[] =
    "property \"Network port\" entry " CONF_PORT " " MSRV_STRINGIFY(MSRV_DEFAULT_PORT) ";"
    "property \"Allow remote connections\" checkbox " CONF_ALLOW_REMOTE " 1;"
    "property \"Music directories\" entry " CONF_MUSIC_DIRS " \"\";"
    "property \"Require authentication\" checkbox " CONF_AUTH_REQUIRED " 0;"
    "property \"User\" entry " CONF_AUTH_USER " \"\";"
    "property \"Password\" password " CONF_AUTH_PASSWORD " \"\";";

Plugin::Plugin()
    : ready_(false),
      pluginDir_(getModulePath(&ddbApi).parent_path()),
      player_(),
      host_(&player_)
{
}

Plugin::~Plugin()
{
}

bool Plugin::reloadConfig()
{
    ConfigMutex mutex;
    ConfigLockGuard lock(mutex);

    int port = ddbApi->conf_get_int(CONF_PORT, MSRV_DEFAULT_PORT);
    bool allowRemote = ddbApi->conf_get_int(CONF_ALLOW_REMOTE, 1) != 0;
    const char* musicDirList = ddbApi->conf_get_str_fast(CONF_MUSIC_DIRS, "");
    bool authRequired = ddbApi->conf_get_int(CONF_AUTH_REQUIRED, 0) != 0;
    const char* authUser = ddbApi->conf_get_str_fast(CONF_AUTH_USER, "");
    const char* authPassword = ddbApi->conf_get_str_fast(CONF_AUTH_PASSWORD, "");

    if (settings_.port == port &&
        settings_.allowRemote == allowRemote &&
        musicDirList_ == musicDirList &&
        settings_.authRequired == authRequired &&
        settings_.authUser == authUser &&
        settings_.authPassword == authPassword)
    {
        return false;
    }

    settings_.port = port;
    settings_.allowRemote = allowRemote;
    musicDirList_ = musicDirList;
    settings_.musicDirs.clear();
    settings_.musicDirs = parseValueList<std::string>(musicDirList_, ';');
    settings_.authRequired = authRequired;
    settings_.authUser = authUser;
    settings_.authPassword = authPassword;

    if (!pluginDir_.empty())
        settings_.staticDir = pathToUtf8(pluginDir_ / pathFromUtf8(MSRV_WEB_ROOT));
    else
        settings_.staticDir = std::string();

    return true;
}

void Plugin::handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2)
{
    switch (id)
    {
    case DB_EV_CONFIGCHANGED:
        if (ready_ && reloadConfig())
            host_.reconfigure(settings_);
        break;

    case DB_EV_PLUGINSLOADED:
        ready_ = true;
        reloadConfig();
        host_.reconfigure(settings_);
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

    p.api_vmajor = 1;
    p.api_vminor = DDB_API_LEVEL;
    p.version_major = MSRV_VERSION_MAJOR;
    p.version_minor = MSRV_VERSION_MINOR;
    p.type = DB_PLUGIN_MISC;
    p.id = MSRV_PROJECT_ID;
    p.name = MSRV_PROJECT_NAME;
    p.descr = MSRV_PROJECT_DESC;
    p.copyright = MSRV_LICENSE_TEXT;
    p.website = MSRV_PROJECT_URL;
    p.start = start;
    p.stop = stop;
    p.connect = connect;
    p.disconnect = disconnect;
    p.message = handleMessage;
    p.configdialog = configDialog_;
}

int PluginWrapper::start()
{
    static StderrLogger logger;
    Logger::setCurrent(&logger);

    auto ok = tryCatchLog([]
    {
        setLocaleCharset();
        instance_ = new Plugin();
    });

    if (ok)
        return 0;

    Logger::setCurrent(nullptr);
    return -1;
}

int PluginWrapper::stop()
{
    if (instance_)
    {
        tryCatchLog([] { delete instance_; });
        instance_ = nullptr;
    }

    Logger::setCurrent(nullptr);
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

}}
