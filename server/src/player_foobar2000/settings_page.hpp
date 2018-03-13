#pragma once

#include "common.hpp"
#include "../project_info.hpp"
#include "../charset.hpp"

#include <string>
#include <vector>

namespace msrv {
namespace player_foobar2000 {

class ListBox
{
public:
    ListBox()
        : handle_(nullptr)
    {
    }

    ListBox(HWND parent, int control)
        : handle_(GetDlgItem(parent, control))
    {
    }

    void add(const char* str, size_t len)
    {
        auto wstr = utf8To16(str, len);
        SendMessageW(handle_, LB_ADDSTRING, 0, reinterpret_cast<LPARAM>(wstr.c_str()));
    }

    void clear()
    {
        SendMessageW(handle_, LB_RESETCONTENT, 0, 0);
    }

    LONG_PTR selectedIndex()
    {
        return SendMessageW(handle_, LB_GETCURSEL, 0, 0);
    }

    void remove(size_t index)
    {
        SendMessageW(handle_, LB_DELETESTRING, index, 0);
    }

private:
    HWND handle_;
};

class SettingsPage : public preferences_page_v3
{
public:
    SettingsPage();
    ~SettingsPage();

    virtual const char * get_name() override { return MSRV_PROJECT_NAME; }
    virtual GUID get_guid() override { return guid_; }
    virtual GUID get_parent_guid() override { return preferences_page::guid_root; }
    virtual bool get_help_url(pfc::string_base & p_out) override { return false;  }
    virtual double get_sort_priority() override { return 1; }
    virtual preferences_page_instance::ptr instantiate(
        HWND parent, preferences_page_callback::ptr callback) override;

private:
    static const GUID guid_;
};

class SettingsPageInstance : public preferences_page_instance
{
public:
    SettingsPageInstance(HWND parent, preferences_page_callback::ptr callback);
    ~SettingsPageInstance();

    virtual t_uint32 get_state() override;
    virtual HWND get_wnd() { return handle_; }
    virtual void apply() override;
    virtual void reset() override;

private:
    static INT_PTR CALLBACK dialogProcWrapper(
        HWND window, UINT message, WPARAM wparam, LPARAM lparam);

    INT_PTR dialogProc(UINT message, WPARAM wparam, LPARAM lparam);
    INT_PTR handleCommand(int control, int message);

    void load();
    bool hasChanges();
    void addMusicDir();
    void removeMusicDir();
    void updateAuthControls();
    void notifyChanged() { callback_->on_state_changed(); }

    HWND parent_;
    HWND handle_;
    ListBox musicDirsList_;
    std::vector<std::string> musicDirs_;
    preferences_page_callback::ptr callback_;
};

}}
