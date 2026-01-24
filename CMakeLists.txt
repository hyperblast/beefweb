cmake_minimum_required(VERSION 3.24)

project(
    beefweb
    VERSION 0.11
    HOMEPAGE_URL "https://github.com/hyperblast/beefweb"
)

set(PROJECT_VERSION_FINAL 0)

set_property(GLOBAL PROPERTY USE_FOLDERS ON)

set(CMAKE_MODULE_PATH       "${CMAKE_CURRENT_SOURCE_DIR}/cmake;${CMAKE_MODULE_PATH}")
set(EXTLIB_SOURCE_DIR       "${CMAKE_CURRENT_SOURCE_DIR}/cpp/extlibs")
set(EXTLIB_INSTALL_DIR      "${CMAKE_CURRENT_BINARY_DIR}/cpp/extlibs-root")
set(EXTLIB_LICENSES_FILE    "${EXTLIB_SOURCE_DIR}/licenses.txt")

include(EnvInfo)
include(ProjectInfo)
include(Utils)

option(ENABLE_TESTS             "Build tests" OFF)
option(ENABLE_GIT_REV           "Include Git revision in produced binaries" OFF)
option(ENABLE_WERROR            "Treat warnings as errors" OFF)
option(ENABLE_LOCAL_LIBS        "Build with local libraries" ON)
option(ENABLE_JS                "Build JS parts" ON)

local_library_option(boost          ENABLE_LOCAL_BOOST "")
local_library_option(nljson         ENABLE_LOCAL_NLJSON "")
local_library_option(catch          ENABLE_LOCAL_CATCH "ENABLE_TESTS")
local_library_option(stringencoders ENABLE_LOCAL_STRINGENCODERS "")

if(OS_POSIX)
	if(NOT OS_MAC)
		option(ENABLE_STATIC_STDLIB     "Build with static libstdc++" OFF)
	endif()

    option(ENABLE_DEADBEEF "Build plugin for deadbeef player" ON)
    option(
        DEADBEEF_INSTALL_INTO_ROOT
        "Install into CMAKE_INSTALL_PREFIX instead of CMAKE_INSTALL_PREFIX/lib/deadbeef. Useful for generating archive package."
        OFF
    )

    local_library_option(deadbeef ENABLE_LOCAL_DEADBEEF "ENABLE_DEADBEEF")

    if(DEADBEEF_INSTALL_INTO_ROOT)
        set(DEADBEEF_INSTALL_DIR ".")
    else()
        set(DEADBEEF_INSTALL_DIR "lib/deadbeef")
    endif()
endif()

if(OS_WINDOWS OR OS_MAC)
    option(ENABLE_FOOBAR2000 "Build plugin for foobar2000 player" ON)

    if(ENABLE_FOOBAR2000)
        local_library(foosdk)
    endif()
endif()

if(OS_WINDOWS)
    local_library_option(zlib ENABLE_LOCAL_ZLIB "")
endif()

if(ENABLE_GIT_REV)
    detect_git_revision(PROJECT_GIT_REV)
else()
    set(PROJECT_GIT_REV unknown)
endif()

if(IS_MULTI_CONFIG)
    set(WEBUI_OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/js/webui/$<CONFIG>)
    file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/build_config.json "{\"isMultiConfig\":true}")
else()
    set(WEBUI_OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/js/webui/output)
    file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/build_config.json "{\"isMultiConfig\":false}")
endif()

print_status()

add_subdirectory(cpp)

if(ENABLE_JS)
    add_subdirectory(js)
endif()

include(Packages)
include(CPack)
