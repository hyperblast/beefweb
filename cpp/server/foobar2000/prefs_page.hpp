#pragma once

#include "common.hpp"
#include <foobar2000/SDK/coreDarkMode.h>

namespace msrv::player_foobar2000 {

class PrefsPageInstance : public preferences_page_instance
{
public:
    PrefsPageInstance(const wchar_t* dialogTemplate, HWND parent, preferences_page_callback::ptr callback);
    ~PrefsPageInstance();

    t_uint32 get_state() override;

    HWND get_wnd() override
    {
        return window_;
    }

    virtual void apply()
    {
    }

    virtual void reset()
    {
    }

protected:
    HWND window()
    {
        return window_;
    }

    HWND parentWindow()
    {
        return parentWindow_;
    }

    void notifyChanged()
    {
        callback_->on_state_changed();
    }

    virtual INT_PTR dialogProc(UINT message, WPARAM wparam, LPARAM lparam);

    virtual INT_PTR handleCommand(int control, int message)
    {
        return 0;
    }

    virtual INT_PTR handleNotify(NMHDR* data)
    {
        return 0;
    }

    virtual bool hasChanges()
    {
        return false;
    }

private:
    static INT_PTR CALLBACK dialogProcWrapper(HWND window, UINT message, WPARAM wparam, LPARAM lparam);

    HWND window_ = nullptr;
    HWND parentWindow_ = nullptr;
    preferences_page_callback::ptr callback_;
    fb2k::CCoreDarkModeHooks darkModeHooks_;
};

}
