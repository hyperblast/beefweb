#include "plugin.hpp"
#include "../log.hpp"

#define CONF_PORT           MSRV_PROJECT_ID ".port"
#define CONF_ALLOW_REMOTE   MSRV_PROJECT_ID ".allow_remote"
#define CONF_MUSIC_DIRS     MSRV_PROJECT_ID ".music_dirs"
#define CONF_AUTH_REQUIRED  MSRV_PROJECT_ID ".auth.required"
#define CONF_AUTH_USER      MSRV_PROJECT_ID ".auth.user"
#define CONF_AUTH_PASSWORD  MSRV_PROJECT_ID ".auth.password"

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
{
    pluginDir = getModulePath(&pluginDef).parent_path();

    player_.reset(new PlayerImpl());
    host_.reset(new Host(player_.get()));

    reloadConfig();
    host_->reconfigure(settings_);
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

    if (!pluginDir.empty())
        settings_.staticDir = pathToUtf8(pluginDir / pathFromUtf8(MSRV_WEB_ROOT));
    else
        settings_.staticDir = std::string();

    return true;
}

void Plugin::connect()
{
    player_->connect();
}

void Plugin::disconnect()
{
    player_->disconnect();
}

void Plugin::handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2)
{
    if (id == DB_EV_CONFIGCHANGED && reloadConfig())
        host_->reconfigure(settings_);

    player_->handleMessage(id, ctx, p1, p2);
}

static int pluginStart()
{
    return tryCatchLog([] { pluginInstance = new Plugin(); }) ? 0 : -1;
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
    if (pluginDef.plugin.api_vmajor)
        return;

    pluginDef.plugin.api_vmajor = 1;
    pluginDef.plugin.api_vminor = DDB_API_LEVEL;
    pluginDef.plugin.version_major = 0;
    pluginDef.plugin.version_minor = 1;
    pluginDef.plugin.type = DB_PLUGIN_MISC;
    pluginDef.plugin.id = MSRV_PROJECT_ID;
    pluginDef.plugin.name = MSRV_PROJECT_NAME;
    pluginDef.plugin.descr = MSRV_PROJECT_DESC;
    pluginDef.plugin.copyright = MSRV_LICENSE_TEXT;
    pluginDef.plugin.website = MSRV_PROJECT_URL;
    pluginDef.plugin.start = pluginStart;
    pluginDef.plugin.stop = pluginStop;
    pluginDef.plugin.connect = pluginConnect;
    pluginDef.plugin.disconnect = pluginDisconnect;
    pluginDef.plugin.message = pluginMessage;
    pluginDef.plugin.configdialog = PLUGIN_CONFIG_DIALOG;
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
