#include "main_prefs_page.hpp"
#include "settings.hpp"
#include "plugin.hpp"
#include "resource.h"

#include "log.hpp"
#include "system.hpp"
#include "project_info.hpp"

namespace msrv::player_foobar2000 {

namespace {
preferences_page_factory_t<MainPrefsPage> factory;
}

MainPrefsPageInstance::MainPrefsPageInstance(HWND parent, preferences_page_callback::ptr callback)
    : PrefsPageInstance(MAKEINTRESOURCEW(IDD_MAIN_PREFS), parent, callback)
{
    initialize();
}

INT_PTR MainPrefsPageInstance::handleCommand(int control, int message)
{
    switch (control)
    {
    case IDC_PORT:
    case IDC_AUTH_USER:
    case IDC_AUTH_PASSWORD:
        if (message == EN_CHANGE)
            notifyChanged();
        return 1;

    case IDC_ALLOW_REMOTE:
        if (message == BN_CLICKED)
            notifyChanged();
        return 1;

    case IDC_AUTH_REQUIRED:
        if (message == BN_CLICKED)
        {
            updateAuthControls();
            notifyChanged();
        }

        return 1;

    case IDC_MUSIC_DIR_ADD:
        if (message == BN_CLICKED)
            addMusicDir();
        return 1;

    case IDC_MUSIC_DIR_REMOVE:
        if (message == BN_CLICKED)
            removeMusicDir();
        return 1;

    case IDC_AUTH_SHOW_PASSWORD:
        if (message == BN_CLICKED)
            updateAuthShowPassword();
        return 1;

    default:
        return 0;
    }
}

INT_PTR MainPrefsPageInstance::handleNotify(NMHDR* data)
{
    if (data->code != NM_CLICK && data->code != NM_RETURN)
    {
        return 0;
    }

    switch (data->idFrom)
    {
    case IDC_LINK_OPEN:
        shellExecute((("http://localhost:" + toString(settings_store::port)).c_str()));
        break;

    case IDC_LINK_DONATE:
        shellExecute(MSRV_DONATE_URL);
        break;

    case IDC_LINK_SOURCES:
        shellExecute(MSRV_PROJECT_URL);
        break;

    case IDC_LINK_3RD_PARTY_LICENSES:
        shellExecute((SettingsData::getDefaultWebRoot() / MSRV_PATH_LITERAL(MSRV_WEBUI_LICENSES_FILE)).c_str());
        break;

    case IDC_LINK_API_DOCS:
        shellExecute(MSRV_API_DOCS_URL);
        break;
    }

    return 0;
}

void MainPrefsPageInstance::initialize()
{
    passwordChar_ = static_cast<int>(SendDlgItemMessageW(window(), IDC_AUTH_PASSWORD, EM_GETPASSWORDCHAR, 0, 0));

    SetDlgItemInt(window(), IDC_PORT, settings_store::port, 0);
    uButton_SetCheck(window(), IDC_ALLOW_REMOTE, settings_store::allowRemote);

    musicDirs_ = settings_store::getMusicDirs();

    for (auto& dir : musicDirs_)
        uSendDlgItemMessageText(window(), IDC_MUSIC_DIRS, LB_ADDSTRING, 0, dir.c_str());

    uButton_SetCheck(window(), IDC_AUTH_REQUIRED, settings_store::authRequired);
    uSetDlgItemText(window(), IDC_AUTH_USER, settings_store::authUser.get_ptr());
    uSetDlgItemText(window(), IDC_AUTH_PASSWORD, settings_store::authPassword.get_ptr());

    updateAuthControls();
}

void MainPrefsPageInstance::reset()
{
    SetDlgItemInt(window(), IDC_PORT, MSRV_DEFAULT_PORT, 0);
    uButton_SetCheck(window(), IDC_ALLOW_REMOTE, true);

    musicDirs_.clear();
    SendDlgItemMessageW(window(), IDC_MUSIC_DIRS, LB_RESETCONTENT, 0, 0);

    uButton_SetCheck(window(), IDC_AUTH_REQUIRED, false);
    uSetDlgItemText(window(), IDC_AUTH_USER, "");
    uSetDlgItemText(window(), IDC_AUTH_PASSWORD, "");

    updateAuthControls();
    notifyChanged();
}

void MainPrefsPageInstance::apply()
{
    settings_store::port = GetDlgItemInt(window(), IDC_PORT, nullptr, 0);
    settings_store::allowRemote = uButton_GetCheck(window(), IDC_ALLOW_REMOTE);

    settings_store::setMusicDirs(musicDirs_);

    settings_store::authRequired = uButton_GetCheck(window(), IDC_AUTH_REQUIRED);
    settings_store::authUser.set_string(uGetDlgItemText(window(), IDC_AUTH_USER).get_ptr());
    settings_store::authPassword.set_string(uGetDlgItemText(window(), IDC_AUTH_PASSWORD).get_ptr());

    auto plugin = Plugin::current();
    if (plugin)
        plugin->reconfigure();

    notifyChanged();
}

bool MainPrefsPageInstance::hasChanges()
{
    if (settings_store::port != GetDlgItemInt(window(), IDC_PORT, nullptr, 0))
        return true;

    if (settings_store::allowRemote != uButton_GetCheck(window(), IDC_ALLOW_REMOTE))
        return true;

    if (settings_store::getMusicDirs() != musicDirs_)
        return true;

    if (settings_store::authRequired != uButton_GetCheck(window(), IDC_AUTH_REQUIRED))
        return true;

    if (!settings_store::authUser.equals(uGetDlgItemText(window(), IDC_AUTH_USER).get_ptr()))
        return true;

    if (!settings_store::authPassword.equals(uGetDlgItemText(window(), IDC_AUTH_PASSWORD).get_ptr()))
        return true;

    return false;
}

void MainPrefsPageInstance::addMusicDir()
{
    pfc::string8 path;

    if (uBrowseForFolder(parentWindow(), "Select music directory", path) == 0)
        return;

    std::string dir(path.get_ptr(), path.get_length());

    if (std::find(musicDirs_.begin(), musicDirs_.end(), dir) != musicDirs_.end())
        return;

    musicDirs_.emplace_back(std::move(dir));
    uSendDlgItemMessageText(window(), IDC_MUSIC_DIRS, LB_ADDSTRING, 0, path.get_ptr());

    notifyChanged();
}

void MainPrefsPageInstance::removeMusicDir()
{
    auto index = SendDlgItemMessageW(window(), IDC_MUSIC_DIRS, LB_GETCURSEL, 0, 0);

    if (index == LB_ERR)
        return;

    musicDirs_.erase(musicDirs_.begin() + index);
    SendDlgItemMessageW(window(), IDC_MUSIC_DIRS, LB_DELETESTRING, index, 0);

    notifyChanged();
}

void MainPrefsPageInstance::updateAuthControls()
{
    int enabled = uButton_GetCheck(window(), IDC_AUTH_REQUIRED) ? 1 : 0;
    EnableWindow(GetDlgItem(window(), IDC_AUTH_USER), enabled);
    EnableWindow(GetDlgItem(window(), IDC_AUTH_PASSWORD), enabled);
    EnableWindow(GetDlgItem(window(), IDC_AUTH_SHOW_PASSWORD), enabled);
}

void MainPrefsPageInstance::updateAuthShowPassword()
{
    auto passwordEdit = GetDlgItem(window(), IDC_AUTH_PASSWORD);
    auto showPasswordCheckBox = GetDlgItem(window(), IDC_AUTH_SHOW_PASSWORD);
    auto passwordChar = SendMessageW(showPasswordCheckBox, BM_GETCHECK, 0, 0) == BST_CHECKED ? 0 : passwordChar_;
    SendMessageW(passwordEdit, EM_SETPASSWORDCHAR, passwordChar, 0);
    SetFocus(passwordEdit);
    SetFocus(showPasswordCheckBox);
}

}
