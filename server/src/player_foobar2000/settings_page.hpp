#pragma once

#include "common.hpp"

namespace msrv {
namespace player_foobar2000 {

class SettingsPage : public preferences_page_v3
{
public:
    SettingsPage();
    ~SettingsPage();

    virtual const char * get_name() override;
    virtual GUID get_guid() override;
    virtual GUID get_parent_guid() override;;
    virtual bool get_help_url(pfc::string_base & p_out) override;
    virtual double get_sort_priority() override;
    virtual preferences_page_instance::ptr instantiate(
        HWND parent, preferences_page_callback::ptr callback) override;
};

class SettingsPageInstance : public preferences_page_instance
{
public:
    SettingsPageInstance(HWND parent, preferences_page_callback::ptr callback);
    ~SettingsPageInstance();

    virtual t_uint32 get_state() override { return 0; }
    virtual HWND get_wnd() { return handle_; }
    virtual void apply() override { }
    virtual void reset() override { }

private:
    static INT_PTR CALLBACK dialogProcWrapper(
        HWND window, UINT message, WPARAM wparam, LPARAM lparam);

    INT_PTR dialogProc(UINT message, WPARAM wparam, LPARAM lparam);

    HWND handle_;
    preferences_page_callback::ptr callback_;
};

}}
