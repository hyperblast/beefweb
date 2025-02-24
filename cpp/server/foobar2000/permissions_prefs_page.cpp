#include "permissions_prefs_page.hpp"
#include "plugin.hpp"
#include "resource.h"
#include "settings.hpp"

#include "../log.hpp"
#include "../project_info.hpp"
#include "../system.hpp"

namespace msrv::player_foobar2000 {

namespace {
preferences_page_factory_t<PermissionsPrefsPage> factory;
}

PermissionsPrefsPageInstance::PermissionsPrefsPageInstance(HWND parent, preferences_page_callback::ptr callback)
    : PrefsPageInstance(MAKEINTRESOURCEW(IDD_PERMISSIONS_PREFS), parent, callback)
{
    initialize();
}

void PermissionsPrefsPageInstance::apply()
{
    settings_store::allowChangePlaylists = uButton_GetCheck(window(), IDC_ALLOW_CHANGE_PLAYLISTS);
    settings_store::allowChangeOutput = uButton_GetCheck(window(), IDC_ALLOW_CHANGE_OUTPUT);
    settings_store::allowChangeClientConfig = uButton_GetCheck(window(), IDC_ALLOW_CHANGE_CLIENT_CONFIG);

    auto plugin = Plugin::current();
    if (plugin)
        plugin->reconfigure();

    notifyChanged();
}

void PermissionsPrefsPageInstance::reset()
{
    uButton_SetCheck(window(), IDC_ALLOW_CHANGE_PLAYLISTS, true);
    uButton_SetCheck(window(), IDC_ALLOW_CHANGE_OUTPUT, true);
    uButton_SetCheck(window(), IDC_ALLOW_CHANGE_CLIENT_CONFIG, true);

    notifyChanged();
}

INT_PTR PermissionsPrefsPageInstance::handleCommand(int control, int message)
{
    switch (control)
    {
    case IDC_ALLOW_CHANGE_PLAYLISTS:
    case IDC_ALLOW_CHANGE_OUTPUT:
    case IDC_ALLOW_CHANGE_CLIENT_CONFIG:
        if (message == BN_CLICKED)
            notifyChanged();
        return 1;

    default:
        return 0;
    }
}

bool PermissionsPrefsPageInstance::hasChanges()
{
    if (uButton_GetCheck(window(), IDC_ALLOW_CHANGE_PLAYLISTS) != settings_store::allowChangePlaylists)
        return true;

    if (uButton_GetCheck(window(), IDC_ALLOW_CHANGE_OUTPUT) != settings_store::allowChangeOutput)
        return true;

    if (uButton_GetCheck(window(), IDC_ALLOW_CHANGE_CLIENT_CONFIG) != settings_store::allowChangeClientConfig)
        return true;

    return false;
}

void PermissionsPrefsPageInstance::initialize()
{
    uButton_SetCheck(window(), IDC_ALLOW_CHANGE_PLAYLISTS, settings_store::allowChangePlaylists);
    uButton_SetCheck(window(), IDC_ALLOW_CHANGE_OUTPUT, settings_store::allowChangeOutput);
    uButton_SetCheck(window(), IDC_ALLOW_CHANGE_CLIENT_CONFIG, settings_store::allowChangeClientConfig);
}

}
