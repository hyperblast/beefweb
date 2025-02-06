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
    {0x69188a07, 0xe885, 0x462d, {0x81, 0xb0, 0x81, 0x97, 0x68, 0xd5, 0x6c, 0x6}};

SettingsPage::SettingsPage() = default;
SettingsPage::~SettingsPage() = default;

preferences_page_instance::ptr SettingsPage::instantiate(HWND parent, preferences_page_callback::ptr callback)
{
    return preferences_page_instance::ptr(new service_impl_t<SettingsPageInstance>(parent, callback));
}

SettingsPageInstance::SettingsPageInstance(HWND parent, preferences_page_callback::ptr callback)
    : parent_(parent),
      handle_(nullptr),
      callback_(callback)
{
    auto ret = CreateDialogParamW(
        core_api::get_my_instance(),
        MAKEINTRESOURCEW(IDD_SETTINGS),
        parent,
        dialogProcWrapper,
        reinterpret_cast<LPARAM>(this));

    throwIfFailed("CreateDialogParamW", ret != nullptr);
}

SettingsPageInstance::~SettingsPageInstance()
{
    if (handle_)
        DestroyWindow(handle_);
}

void SettingsPageInstance::initialize()
{
    darkModeHooks_.AddDialogWithControls(handle_);

    passwordChar_ = static_cast<int>(SendDlgItemMessageW(handle_, IDC_AUTH_PASSWORD, EM_GETPASSWORDCHAR, 0, 0));

    load();
}

t_uint32 SettingsPageInstance::get_state()
{
    return preferences_state::resettable
        | preferences_state::dark_mode_supported
        | (hasChanges() ? preferences_state::changed : 0);
}

INT_PTR CALLBACK SettingsPageInstance::dialogProcWrapper(HWND window, UINT message, WPARAM wparam, LPARAM lparam)
{
    SettingsPageInstance* instance;

    if (message == WM_INITDIALOG)
    {
        instance = reinterpret_cast<SettingsPageInstance*>(lparam);
        instance->handle_ = window;

        SetWindowLongPtrW(window, DWLP_USER, lparam);
    }
    else
    {
        instance = reinterpret_cast<SettingsPageInstance*>(GetWindowLongPtrW(window, DWLP_USER));
    }

    if (instance)
    {
        INT_PTR result;

        bool processed = tryCatchLog([&] {
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
    case WM_INITDIALOG:
        initialize();
        return 0;

    case WM_COMMAND:
        return handleCommand(LOWORD(wparam), HIWORD(wparam));

    case WM_NOTIFY:
        return handleNotify(reinterpret_cast<NMHDR*>(lparam));

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

INT_PTR SettingsPageInstance::handleNotify(NMHDR* data)
{
    if (data->code != NM_CLICK && data->code != NM_RETURN)
    {
        return 0;
    }

    switch (data->idFrom)
    {
    case IDC_LINK_OPEN:
        shellExecute((("http://localhost:" + toString(SettingVars::port)).c_str()));
        break;

    case IDC_LINK_DONATE:
        shellExecute(MSRV_DONATE_URL);
        break;

    case IDC_LINK_SOURCES:
        shellExecute(MSRV_PROJECT_URL);
        break;

    case IDC_LINK_3RD_PARTY_LICENSES:
        shellExecute(pathToUtf8(SettingsData::getDefaultWebRoot() / MSRV_PATH_LITERAL(MSRV_3RD_PARTY_LICENSES)).c_str());
        break;

    case IDC_LINK_API_DOCS:
        shellExecute(MSRV_API_DOCS_URL);
        break;
    }

    return 0;
}

void SettingsPageInstance::load()
{
    SetDlgItemInt(handle_, IDC_PORT, SettingVars::port, 0);
    uButton_SetCheck(handle_, IDC_ALLOW_REMOTE, SettingVars::allowRemote);

    musicDirs_ = SettingVars::getMusicDirs();

    for (auto& dir : musicDirs_)
        uSendDlgItemMessageText(handle_, IDC_MUSIC_DIRS, LB_ADDSTRING, 0, dir.c_str());

    uButton_SetCheck(handle_, IDC_AUTH_REQUIRED, SettingVars::authRequired);
    uSetDlgItemText(handle_, IDC_AUTH_USER, SettingVars::authUser.get_ptr());
    uSetDlgItemText(handle_, IDC_AUTH_PASSWORD, SettingVars::authPassword.get_ptr());

    updateAuthControls();
}

void SettingsPageInstance::reset()
{
    SetDlgItemInt(handle_, IDC_PORT, MSRV_DEFAULT_PORT, 0);
    uButton_SetCheck(handle_, IDC_ALLOW_REMOTE, true);

    musicDirs_.clear();
    SendDlgItemMessageW(handle_, IDC_MUSIC_DIRS, LB_RESETCONTENT, 0, 0);

    uButton_SetCheck(handle_, IDC_AUTH_REQUIRED, false);
    uSetDlgItemText(handle_, IDC_AUTH_USER, "");
    uSetDlgItemText(handle_, IDC_AUTH_PASSWORD, "");

    updateAuthControls();
    notifyChanged();
}

void SettingsPageInstance::apply()
{
    SettingVars::port = GetDlgItemInt(handle_, IDC_PORT, nullptr, 0);
    SettingVars::allowRemote = uButton_GetCheck(handle_, IDC_ALLOW_REMOTE);

    SettingVars::setMusicDirs(musicDirs_);

    SettingVars::authRequired = uButton_GetCheck(handle_, IDC_AUTH_REQUIRED);
    SettingVars::authUser.set_string(uGetDlgItemText(handle_, IDC_AUTH_USER).get_ptr());
    SettingVars::authPassword.set_string(uGetDlgItemText(handle_, IDC_AUTH_PASSWORD).get_ptr());

    auto plugin = Plugin::current();
    if (plugin)
        plugin->reconfigure();

    notifyChanged();
}

bool SettingsPageInstance::hasChanges()
{
    if (SettingVars::port != GetDlgItemInt(handle_, IDC_PORT, nullptr, 0))
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

void SettingsPageInstance::addMusicDir()
{
    pfc::string8 path;

    if (uBrowseForFolder(parent_, "Select music directory", path) == 0)
        return;

    std::string dir(path.get_ptr(), path.get_length());

    if (std::find(musicDirs_.begin(), musicDirs_.end(), dir) != musicDirs_.end())
        return;

    musicDirs_.emplace_back(std::move(dir));
    uSendDlgItemMessageText(handle_, IDC_MUSIC_DIRS, LB_ADDSTRING, 0, path.get_ptr());

    notifyChanged();
}

void SettingsPageInstance::removeMusicDir()
{
    auto index = SendDlgItemMessageW(handle_, IDC_MUSIC_DIRS, LB_GETCURSEL, 0, 0);

    if (index == LB_ERR)
        return;

    musicDirs_.erase(musicDirs_.begin() + index);
    SendDlgItemMessageW(handle_, IDC_MUSIC_DIRS, LB_DELETESTRING, index, 0);

    notifyChanged();
}

void SettingsPageInstance::updateAuthControls()
{
    int enabled = uButton_GetCheck(handle_, IDC_AUTH_REQUIRED) ? 1 : 0;
    EnableWindow(GetDlgItem(handle_, IDC_AUTH_USER), enabled);
    EnableWindow(GetDlgItem(handle_, IDC_AUTH_PASSWORD), enabled);
    EnableWindow(GetDlgItem(handle_, IDC_AUTH_SHOW_PASSWORD), enabled);
}

void SettingsPageInstance::updateAuthShowPassword()
{
    auto passwordEdit = GetDlgItem(handle_, IDC_AUTH_PASSWORD);
    auto showPasswordCheckBox = GetDlgItem(handle_, IDC_AUTH_SHOW_PASSWORD);
    auto passwordChar = SendMessageW(showPasswordCheckBox, BM_GETCHECK, 0, 0) == BST_CHECKED ? 0 : passwordChar_;
    SendMessageW(passwordEdit, EM_SETPASSWORDCHAR, passwordChar, 0);
    SetFocus(passwordEdit);
    SetFocus(showPasswordCheckBox);
}

namespace { preferences_page_factory_t<SettingsPage> factory; }

}
}
