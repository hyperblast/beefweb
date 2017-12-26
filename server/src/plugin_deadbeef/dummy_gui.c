#define DDB_API_LEVEL 8
#define DDB_WARN_DEPRECATED 1

#include <deadbeef/deadbeef.h>

static int dummy_callback()
{
    return 0;
}

static DB_gui_t plugin_def =
{
    .plugin =
    {
        .api_vmajor = 1,
        .api_vminor = DDB_API_LEVEL,
        .version_major = 1,
        .version_minor = 0,
        .type = DB_PLUGIN_GUI,
        .id = "dummy_gui",
        .name = "Dummy user interface",
        .descr = "Dummy user interface for headless environments",
        .copyright = "Public domain",
        .start = dummy_callback,
        .stop = dummy_callback,
    },
};

DB_plugin_t* ddb_gui_dummy_load(DB_functions_t* ddb)
{
    return DB_PLUGIN(&plugin_def);
}
