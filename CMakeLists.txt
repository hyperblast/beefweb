cmake_minimum_required(VERSION 3.12)

project(beefweb)

set(CMAKE_MODULE_PATH   "${CMAKE_CURRENT_SOURCE_DIR}/cmake;${CMAKE_MODULE_PATH}")
set(EXTLIB_SOURCE_DIR   "${CMAKE_CURRENT_SOURCE_DIR}/cpp/extlibs")
set(EXTLIB_INSTALL_DIR  "${CMAKE_CURRENT_BINARY_DIR}/cpp/extlibs-root")

include(EnvInfo)
include(Utils)

option(ENABLE_TESTS             "Build tests" OFF)
option(ENABLE_GIT_REV           "Include Git revision in produced binaries" OFF)
option(ENABLE_WERROR            "Treat warnings as errors" OFF)
option(ENABLE_LOCAL_LIBS        "Build with local libraries" ON)
option(ENABLE_STATIC_STDLIB     "Build with static libstdc++" OFF)
option(ENABLE_JS                "Build JS parts" ON)

local_library_option(boost          ENABLE_LOCAL_BOOST "")
local_library_option(nljson         ENABLE_LOCAL_NLJSON "")
local_library_option(catch          ENABLE_LOCAL_CATCH "ENABLE_TESTS")
local_library_option(stringencoders ENABLE_LOCAL_STRINGENCODERS "")

if(OS_POSIX)
    option(ENABLE_PLAYER_DEADBEEF "Build plugin for deadbeef player" ON)

    local_library_option(deadbeef ENABLE_LOCAL_DEADBEEF "ENABLE_PLAYER_DEADBEEF")
endif()

if(OS_WINDOWS)
    option(ENABLE_PLAYER_FOOBAR2000 "Build plugin for foobar2000 player" ON)

    if(ENABLE_PLAYER_FOOBAR2000)
        local_library(foosdk)
    endif()

    local_library_option(zlib ENABLE_LOCAL_ZLIB "")
endif()

if(ENABLE_GIT_REV)
    detect_git_revision(GIT_REV)
endif()

add_subdirectory(cpp)

if(ENABLE_JS)
    add_subdirectory(js)
endif()

print_status()
