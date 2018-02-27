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
namespace plugin_deadbeef {

namespace {

DB_misc_t pluginDef;
Plugin* pluginInstance;

const char PLUGIN_CONFIG_DIALOG[] =
    "property \"Network port\" entry " CONF_PORT " 8880;"
    "property \"Allow remote connections\" checkbox " CONF_ALLOW_REMOTE " 1;"
    "property \"Music directories\" entry " CONF_MUSIC_DIRS " \"\";"
    "property \"Require authentication\" checkbox " CONF_AUTH_REQUIRED " 0;"
    "property \"User\" entry " CONF_AUTH_USER " \"\";"
    "property \"Password\" password " CONF_AUTH_PASSWORD " \"\";";

}

Plugin::Plugin()
    : ready_(false),
      pluginDir_(getModulePath(&pluginDef).parent_path()),
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

    int port = ddbApi->conf_get_int(CONF_PORT, 8880);
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

void Plugin::connect()
{
    player_.connect();
}

void Plugin::disconnect()
{
    player_.disconnect();
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

static int pluginStart()
{
    auto ok = tryCatchLog([]
    {
        setLocaleCharset();
        pluginInstance = new Plugin();
    });

    return ok ? 0 : -1;
}

static int pluginStop()
{
    if (pluginInstance)
    {
        tryCatchLog([] { delete pluginInstance; });
        pluginInstance = nullptr;
    }

    return 0;
}

static int pluginConnect()
{
    return tryCatchLog([] { pluginInstance->connect(); }) ? 0 : -1;
}

static int pluginDisconnect()
{
    return tryCatchLog([] { pluginInstance->disconnect(); }) ? 0 : -1;
}

static int pluginMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2)
{
    return tryCatchLog([&] { pluginInstance->handleMessage(id, ctx, p1, p2); }) ? 0 : -1;
}

static void pluginInitDef()
{
    auto& p = pluginDef.plugin;

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
    p.start = pluginStart;
    p.stop = pluginStop;
    p.connect = pluginConnect;
    p.disconnect = pluginDisconnect;
    p.message = pluginMessage;
    p.configdialog = PLUGIN_CONFIG_DIALOG;
}

extern "C" DB_plugin_t* MSRV_PREFIXED(load)(DB_functions_t* api)
{
    static StderrLogger logger(MSRV_PROJECT_ID);
    Logger::setCurrent(&logger);

    ddbApi = api;
    pluginInitDef();
    return DB_PLUGIN(&pluginDef);
}

}}
