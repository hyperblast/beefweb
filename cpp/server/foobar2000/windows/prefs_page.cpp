#include "prefs_page.hpp"
#include "system.hpp"
#include "log.hpp"

namespace msrv::player_foobar2000 {

PrefsPageInstance::PrefsPageInstance(const wchar_t* dialogTemplate, HWND parent, preferences_page_callback::ptr callback)
    : window_(nullptr),
      parentWindow_(parent),
      callback_(callback)
{
    auto ret = CreateDialogParamW(
        core_api::get_my_instance(),
        dialogTemplate,
        parent,
        dialogProcWrapper,
        reinterpret_cast<LPARAM>(this));

    throwIfFailed("CreateDialogParamW", ret != nullptr);
}

PrefsPageInstance::~PrefsPageInstance()
{
    if (window_)
        DestroyWindow(window_);
}

t_uint32 PrefsPageInstance::get_state()
{
    return preferences_state::resettable
        | preferences_state::dark_mode_supported
        | (hasChanges() ? preferences_state::changed : 0);
}

INT_PTR CALLBACK PrefsPageInstance::dialogProcWrapper(HWND window, UINT message, WPARAM wparam, LPARAM lparam)
{
    PrefsPageInstance* instance;

    if (message == WM_INITDIALOG)
    {
        instance = reinterpret_cast<PrefsPageInstance*>(lparam);
        instance->window_ = window;

        SetWindowLongPtrW(window, DWLP_USER, lparam);
    }
    else
    {
        instance = reinterpret_cast<PrefsPageInstance*>(GetWindowLongPtrW(window, DWLP_USER));
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

INT_PTR PrefsPageInstance::dialogProc(UINT message, WPARAM wparam, LPARAM lparam)
{
    switch (message)
    {
    case WM_INITDIALOG:
        darkModeHooks_.AddDialogWithControls(window_);
        return 0;

    case WM_COMMAND:
        return handleCommand(LOWORD(wparam), HIWORD(wparam));

    case WM_NOTIFY:
        return handleNotify(reinterpret_cast<NMHDR*>(lparam));

    case WM_DESTROY:
        window_ = nullptr;
        return 0;
    }

    return DefWindowProcW(window_, message, wparam, lparam);
}

}
