#pragma once

#include "common.hpp"
#include "prefs_page.hpp"
#include "utils.hpp"

namespace msrv::player_foobar2000 {

class PermissionsPrefsPageInstance : public PrefsPageInstance
{
public:
    PermissionsPrefsPageInstance(HWND parent, preferences_page_callback::ptr callback);
    ~PermissionsPrefsPageInstance() = default;

    void apply() override;
    void reset() override;

protected:
    INT_PTR handleCommand(int control, int message) override;
    bool hasChanges() override;

private:
    void initialize();
};

class PermissionsPrefsPage : public preferences_page_v3
{
public:
    PermissionsPrefsPage() = default;
    ~PermissionsPrefsPage() = default;

    const char* get_name() override
    {
        return "Permissions";
    }

    GUID get_guid() override
    {
        return prefs_pages::permissions;
    }

    GUID get_parent_guid() override
    {
        return prefs_pages::main;
    }

    bool get_help_url(pfc::string_base& p_out) override
    {
        return false;
    }

    double get_sort_priority() override
    {
        return 0;
    }

    preferences_page_instance::ptr instantiate(HWND parent, preferences_page_callback::ptr callback) override
    {
        return preferences_page_instance::ptr(new service_impl_t<PermissionsPrefsPageInstance>(parent, callback));
    }
};

}
