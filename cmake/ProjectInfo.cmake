set(PROJECT_COPYRIGHT       "Copyright 2015-2026 Hyperblast")

set(DEADBEEF_ENTRY_POINT    "beefweb_load")
set(DEADBEEF_PLUGIN_FILE    "beefweb")
set(DEADBEEF_PACKAGE_NAME   "ddb_beefweb")

set(FOOBAR2000_PLUGIN_FILE  "foo_beefweb")
set(FOOBAR2000_PACKAGE_NAME "foo_beefweb")

set(WEBUI_ROOT              "beefweb.root")
set(WEBUI_LICENSES_FILE     "third-party-licenses.txt")

set(CPACK_PACKAGE_VENDOR    "Hyperblast")
set(CPACK_PACKAGE_CONTACT   "Hyperblast <dev@bitflow.org>")

set(CPACK_DEBIAN_DEADBEEF_PLUGIN_PACKAGE_NAME       "deadbeef-beefweb")
set(CPACK_DEBIAN_DEADBEEF_PLUGIN_PACKAGE_DEPENDS    "deadbeef-static (>=1.8.0)")
set(CPACK_DEBIAN_DEADBEEF_PLUGIN_PACKAGE_SECTION    "sound")

set(
    CPACK_DEBIAN_DEADBEEF_PLUGIN_DESCRIPTION
    "Plugin for DeaDBeeF that provides web interface and HTTP API for controlling player remotely"
)
