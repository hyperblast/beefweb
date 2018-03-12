#include "settings_page.hpp"
#include "settings.hpp"
#include "plugin.hpp"
#include "resource.h"

#include "../log.hpp"
#include "../system.hpp"
#include "../project_info.hpp"

namespace msrv {
namespace player_foobar2000 {

// {69188A07-E885-462D-81B0-819768D56C06}
const GUID SettingsPage::guid_ =
    { 0x69188a07, 0xe885, 0x462d, { 0x81, 0xb0, 0x81, 0x97, 0x68, 0xd5, 0x6c, 0x6 } };

SettingsPage::SettingsPage() = default;
SettingsPage::~SettingsPage() = default;

preferences_page_instance::ptr SettingsPage::instantiate(
    HWND parent, preferences_page_callback::ptr callback)
{
    return preferences_page_instance::ptr(
        new service_impl_t<SettingsPageInstance>(parent, callback));
}

SettingsPageInstance::SettingsPageInstance(
    HWND parent, preferences_page_callback::ptr callback)
    : parent_(parent),
      handle_(nullptr),
      musicDirsList_(nullptr),
      callback_(callback)
{
    handle_ = CreateDialogW(
        core_api::get_my_instance(),
        MAKEINTRESOURCEW(IDD_SETTINGS),
        parent,
        dialogProcWrapper);

    if (!handle_)
        throwIfFailed("CreateDialogW", handle_ != nullptr);

    SetWindowLongPtrW(handle_, DWLP_USER, reinterpret_cast<LONG_PTR>(this));

    musicDirsList_ = GetDlgItem(handle_, IDC_MUSIC_DIRS);
    throwIfFailed("GetDlgItem", musicDirsList_ != nullptr);

    load();
    updateAuthControls();
}

SettingsPageInstance::~SettingsPageInstance()
{
    if (handle_)
        DestroyWindow(handle_);
}

INT_PTR CALLBACK SettingsPageInstance::dialogProcWrapper(
    HWND window, UINT message, WPARAM wparam, LPARAM lparam)
{
    auto instance = reinterpret_cast<SettingsPageInstance*>(
        GetWindowLongPtrW(window, DWLP_USER));

    if (instance)
    {
        INT_PTR result;

        bool processed = tryCatchLog([&]
        {
            result = instance->dialogProc(message, wparam, lparam);
        });

        if (processed)
            return result;
    }

    return DefWindowProcW(window, message, wparam, lparam);
}

INT_PTR SettingsPageInstance::dialogProc(UINT message, WPARAM wparam, LPARAM lparam)
{
    switch (message)
    {
    case WM_COMMAND:
        return handleCommand(LOWORD(wparam), HIWORD(wparam));

    case WM_DESTROY:
        handle_ = nullptr;
        return 0;
    }

    return DefWindowProcW(handle_, message, wparam, lparam);
}

INT_PTR SettingsPageInstance::handleCommand(int control, int message)
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
            browseAndAddMusicDir();
        return 1;

    case IDC_MUSIC_DIR_REMOVE:
        if (message == BN_CLICKED)
            removeSelectedMusicDir();
        return 1;

    default:
        return 0;
    }
}

void SettingsPageInstance::load()
{
    SetDlgItemInt(handle_, IDC_PORT, SettingVars::port, 0);
    uButton_SetCheck(handle_, IDC_ALLOW_REMOTE, SettingVars::allowRemote);

    musicDirs_ = SettingVars::getMusicDirs();

    SendMessageW(musicDirsList_, LB_RESETCONTENT, 0, 0);

    for (auto& dir : musicDirs_)
        addMusicDir(dir.data(), dir.length());

    uButton_SetCheck(handle_, IDC_AUTH_REQUIRED, SettingVars::authRequired);
    uSetDlgItemText(handle_, IDC_AUTH_USER, SettingVars::authUser.get_ptr());
    uSetDlgItemText(handle_, IDC_AUTH_PASSWORD, SettingVars::authPassword.get_ptr());
}

void SettingsPageInstance::save()
{
    SettingVars::port = getPort();
    SettingVars::allowRemote = uButton_GetCheck(handle_, IDC_ALLOW_REMOTE);

    SettingVars::setMusicDirs(musicDirs_);

    SettingVars::authRequired = uButton_GetCheck(handle_, IDC_AUTH_REQUIRED);
    SettingVars::authUser.set_string(uGetDlgItemText(handle_, IDC_AUTH_USER).get_ptr());
    SettingVars::authPassword.set_string(uGetDlgItemText(handle_, IDC_AUTH_PASSWORD).get_ptr());

    if (auto plugin = Plugin::current())
        plugin->reconfigure();
}

bool SettingsPageInstance::hasChanges()
{
    if (SettingVars::port != getPort())
        return true;

    if (SettingVars::allowRemote != uButton_GetCheck(handle_, IDC_ALLOW_REMOTE))
        return true;

    if (SettingVars::getMusicDirs() != musicDirs_)
        return true;

    if (SettingVars::authRequired != uButton_GetCheck(handle_, IDC_AUTH_REQUIRED))
        return true;

    if (!SettingVars::authUser.equals(uGetDlgItemText(handle_, IDC_AUTH_USER).get_ptr()))
        return true;

    if (!SettingVars::authPassword.equals(uGetDlgItemText(handle_, IDC_AUTH_PASSWORD).get_ptr()))
        return true;

    return false;
}

int SettingsPageInstance::getPort()
{
    BOOL ok;
    UINT port = GetDlgItemInt(handle_, IDC_PORT, &ok, 0);
    return ok != 0 ? port : MSRV_DEFAULT_PORT;
}

void SettingsPageInstance::addMusicDir(const char* str, size_t len)
{
    auto wstr = utf8To16(str, len);
    SendMessageW(musicDirsList_, LB_ADDSTRING, 0, reinterpret_cast<LPARAM>(wstr.c_str()));
}

void SettingsPageInstance::browseAndAddMusicDir()
{
    pfc::string8 path;

    if (uBrowseForFolder(parent_, "Select music directory", path) != 0)
    {
        // TODO: handle duplicate items
        musicDirs_.emplace_back(path.get_ptr(), path.get_length());
        addMusicDir(path.get_ptr(), path.get_length());
        notifyChanged();
    }
}

void SettingsPageInstance::removeSelectedMusicDir()
{
    auto index = SendMessageW(musicDirsList_, LB_GETCURSEL, 0, 0);

    if (index != LB_ERR)
    {
        musicDirs_.erase(musicDirs_.begin() + index);
        SendMessageW(musicDirsList_, LB_DELETESTRING, index, 0);
        notifyChanged();
    }
}

void SettingsPageInstance::updateAuthControls()
{
    int enabled = uButton_GetCheck(handle_, IDC_AUTH_REQUIRED) ? 1 : 0;
    EnableWindow(GetDlgItem(handle_, IDC_AUTH_USER), enabled);
    EnableWindow(GetDlgItem(handle_, IDC_AUTH_PASSWORD), enabled);
}

namespace { preferences_page_factory_t<SettingsPage> factory; }

}}
