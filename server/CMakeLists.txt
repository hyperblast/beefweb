cmake_minimum_required(VERSION 3.6)

project(beefweb)

set(PROJECT_ID beefweb)
set(CUSTOM_MODULE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/cmake")
set(CMAKE_MODULE_PATH "${CUSTOM_MODULE_DIR};${CMAKE_MODULE_PATH}")

include(Utils)

option(ENABLE_PLUGIN_DEADBEEF   "Build deadbeef plugin" ON)
option(ENABLE_TESTS             "Build tests" OFF)
option(ENABLE_WERROR            "Treat warnings as errors" OFF)
option(ENABLE_LOCAL_LIBS        "Build with local libraries" ON)
option(ENABLE_STATIC_STDLIB     "Build with static libstdc++" OFF)

local_library_option(boost      ENABLE_LOCAL_BOOST "")
local_library_option(libevent   ENABLE_LOCAL_LIBEVENT "")
local_library_option(libevhtp   ENABLE_LOCAL_LIBEVHTP "")
local_library_option(nljson     ENABLE_LOCAL_NLJSON "")
local_library_option(deadbeef   ENABLE_LOCAL_DEADBEEF "ENABLE_PLUGIN_DEADBEEF")
local_library_option(catch      ENABLE_LOCAL_CATCH "ENABLE_TESTS")

print_options()

set(COMMON_C_FLAGS    "-fPIC -pthread -D_GNU_SOURCE=1 -D_FILE_OFFSET_BITS=64")
set(COMMON_CXX_FLAGS  "${COMMON_C_FLAGS}")

set(CMAKE_C_FLAGS   "${CMAKE_C_FLAGS} ${COMMON_C_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMMON_CXX_FLAGS}")

set(EXTLIB_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/extlibs)
set(EXTLIB_INSTALL_DIR ${CMAKE_CURRENT_BINARY_DIR}/extlibs/root)

add_custom_target(extlibs)

add_subdirectory(extlibs)
add_subdirectory(src)
