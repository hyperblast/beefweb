#include "settings_page.hpp"
#include "resource.h"
#include "../log.hpp"
#include "../system.hpp"
#include "../project_info.hpp"

namespace msrv {
namespace player_foobar2000 {

SettingsPage::SettingsPage() = default;
SettingsPage::~SettingsPage() = default;

const char* SettingsPage::get_name()
{
    return MSRV_PROJECT_NAME;
}

GUID SettingsPage::get_guid()
{
    // {69188A07-E885-462D-81B0-819768D56C06}
    static const GUID guid = {
        0x69188a07, 0xe885, 0x462d,
        { 0x81, 0xb0, 0x81, 0x97, 0x68, 0xd5, 0x6c, 0x6 } };

    return guid;
}

GUID SettingsPage::get_parent_guid()
{
    return preferences_page::guid_root;
}

bool SettingsPage::get_help_url(pfc::string_base & p_out)
{
    return false;
}

double SettingsPage::get_sort_priority()
{
    return 1;
}

preferences_page_instance::ptr SettingsPage::instantiate(
    HWND parent,
    preferences_page_callback::ptr callback)
{
    return preferences_page_instance::ptr(
        new service_impl_t<SettingsPageInstance>(parent, callback));
}

SettingsPageInstance::SettingsPageInstance(
    HWND parent,
    preferences_page_callback::ptr callback)
    : handle_(nullptr),
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
    case WM_DESTROY:
        handle_ = nullptr;
        return 0;
    }

    return DefWindowProcW(handle_, message, wparam, lparam);
}

namespace { preferences_page_factory_t<SettingsPage> factory; }

}}
