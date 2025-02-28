set(DEADBEEF_PLUGIN_FILE "beefweb")
set(FOOBAR2000_PLUGIN_FILE "foo_beefweb")
set(WEBUI_ROOT "beefweb.root")

set(CPACK_PACKAGE_VENDOR "Hyperblast")

if(ENABLE_DEADBEEF_SINGLE_DIR)
    set(DEADBEEF_LIB_DIR ".")
else()
    set(DEADBEEF_LIB_DIR "lib/deadbeef")
endif()

if(OS_WINDOWS)
    set(CPACK_GENERATOR ZIP)
else()
    set(CPACK_GENERATOR TXZ)
endif()
