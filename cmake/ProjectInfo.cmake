set(DEADBEEF_PLUGIN_FILE    "beefweb")
set(FOOBAR2000_PLUGIN_FILE  "foo_beefweb")
set(WEBUI_ROOT              "beefweb.root")

set(CPACK_PACKAGE_VENDOR "Hyperblast")

set(CPACK_ARCHIVE_DEADBEEF_PLUGIN_FILE_NAME      "ddb_beefweb-${CMAKE_PROJECT_VERSION}")
set(CPACK_ARCHIVE_FOOBAR2000_PLUGIN_FILE_NAME    "foo_beefweb-${CMAKE_PROJECT_VERSION}")

set(CPACK_STRIP_FILES ON)
set(CPACK_ARCHIVE_COMPONENT_INSTALL ON)
set(CPACK_INCLUDE_TOPLEVEL_DIRECTORY OFF)

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

# If there is only one component CPack ignores CPACK_ARCHIVE_COMPONENT_INSTALL
# Provide archive file name for such case

if(ENABLE_DEADBEEF)
    set(CPACK_PACKAGE_FILE_NAME ${CPACK_ARCHIVE_DEADBEEF_PLUGIN_FILE_NAME})
endif()

if(ENABLE_FOOBAR2000)
    set(CPACK_PACKAGE_FILE_NAME ${CPACK_ARCHIVE_FOOBAR2000_PLUGIN_FILE_NAME})
endif()
