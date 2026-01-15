#include "permissions_prefs_page.hpp"
#include "plugin.hpp"
#include "resource.h"
#include "settings.hpp"

#include "log.hpp"
#include "project_info.hpp"
#include "system.hpp"

namespace msrv::player_foobar2000 {

namespace {

struct ControlMapping
{
    int control;
    cfg_bool* config;

    operator bool() const
    {
        return config != nullptr;
    }
};

const ControlMapping controlMappings[] = {
    {IDC_ALLOW_CHANGE_PLAYLISTS, &settings_store::allowChangePlaylists},
    {IDC_ALLOW_CHANGE_OUTPUT, &settings_store::allowChangeOutput},
    {IDC_ALLOW_CHANGE_CLIENT_CONFIG, &settings_store::allowChangeClientConfig},
    {0, nullptr},
};

preferences_page_factory_t<PermissionsPrefsPage> factory;

}

PermissionsPrefsPageInstance::PermissionsPrefsPageInstance(HWND parent, preferences_page_callback::ptr callback)
    : PrefsPageInstance(MAKEINTRESOURCEW(IDD_PERMISSIONS_PREFS), parent, callback)
{
    initialize();
}

void PermissionsPrefsPageInstance::apply()
{
    for (int i = 0; controlMappings[i]; i++)
        *controlMappings[i].config = uButton_GetCheck(window(), controlMappings[i].control);

    auto plugin = Plugin::current();
    if (plugin)
        plugin->reconfigure();

    notifyChanged();
}

void PermissionsPrefsPageInstance::reset()
{
    for (int i = 0; controlMappings[i]; i++)
        uButton_SetCheck(window(), controlMappings[i].control, true);

    notifyChanged();
}

INT_PTR PermissionsPrefsPageInstance::handleCommand(int control, int message)
{
    if (message == BN_CLICKED)
        notifyChanged();

    return 1;
}

bool PermissionsPrefsPageInstance::hasChanges()
{
    for (int i = 0; controlMappings[i]; i++)
        if (uButton_GetCheck(window(), controlMappings[i].control) != *controlMappings[i].config)
            return true;

    return false;
}

void PermissionsPrefsPageInstance::initialize()
{
    for (int i = 0; controlMappings[i]; i++)
        uButton_SetCheck(window(), controlMappings[i].control, *controlMappings[i].config);
}

}
