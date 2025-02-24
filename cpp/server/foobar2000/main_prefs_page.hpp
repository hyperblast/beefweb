#pragma once

#include "common.hpp"
#include "prefs_page.hpp"

#include "../project_info.hpp"
#include "../charset.hpp"

#include <string>
#include <vector>

namespace msrv::player_foobar2000 {

class MainPrefsPage : public preferences_page_v3
{
public:
    MainPrefsPage() = default;
    ~MainPrefsPage() = default;

    virtual const char* get_name() override
    {
        return MSRV_PROJECT_NAME;
    }

    virtual GUID get_guid() override
    {
        return guid_;
    }

    virtual GUID get_parent_guid() override
    {
        return preferences_page::guid_tools;
    }

    virtual bool get_help_url(pfc::string_base& p_out) override
    {
        return false;
    }

    virtual double get_sort_priority() override
    {
        return 0;
    }

    virtual preferences_page_instance::ptr instantiate(HWND parent, preferences_page_callback::ptr callback) override;

private:
    static const GUID guid_;
};

class MainPrefsPageInstance : public PrefsPageInstance
{
public:
    MainPrefsPageInstance(HWND parent, preferences_page_callback::ptr callback);
    ~MainPrefsPageInstance() = default;

    void apply() override;
    void reset() override;

protected:
    INT_PTR handleCommand(int control, int message) override;
    INT_PTR handleNotify(NMHDR* data) override;
    bool hasChanges() override;

private:
    static void shellExecute(const char* fileOrUrl)
    {
        uShellExecute(core_api::get_main_window(), nullptr, fileOrUrl, nullptr, nullptr, SW_SHOWNORMAL);
    }

    static void shellExecute(const wchar_t* fileOrUrl)
    {
        ShellExecuteW(core_api::get_main_window(), nullptr, fileOrUrl, nullptr, nullptr, SW_SHOWNORMAL);
    }

    void initialize();
    void addMusicDir();
    void removeMusicDir();
    void updateAuthControls();
    void updateAuthShowPassword();

    std::vector<std::string> musicDirs_;
    int passwordChar_ = 0;
};

}
