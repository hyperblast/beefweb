cmake_minimum_required(VERSION 3.6)

project(beefweb)

set(CMAKE_MODULE_PATH   "${CMAKE_CURRENT_SOURCE_DIR}/cmake;${CMAKE_MODULE_PATH}")
set(EXTLIB_SOURCE_DIR   "${CMAKE_CURRENT_SOURCE_DIR}/extlibs")
set(EXTLIB_INSTALL_DIR  "${CMAKE_CURRENT_BINARY_DIR}/extlibs-root")

include(EnvInfo)
include(Utils)

option(ENABLE_TESTS             "Build tests" OFF)
option(ENABLE_WERROR            "Treat warnings as errors" OFF)
option(ENABLE_LOCAL_LIBS        "Build with local libraries" ON)
option(ENABLE_STATIC_STDLIB     "Build with static libstdc++" OFF)

local_library_option(boost  ENABLE_LOCAL_BOOST "")
local_library_option(libb64 ENABLE_LOCAL_LIBB64 "")
local_library_option(nljson ENABLE_LOCAL_NLJSON "")
local_library_option(catch  ENABLE_LOCAL_CATCH "ENABLE_TESTS")

if(OS_POSIX)
    option(ENABLE_PLAYER_DEADBEEF   "Build plugin for deadbeef player" ON)

    local_library_option(libevent   ENABLE_LOCAL_LIBEVENT "")
    local_library_option(libevhtp   ENABLE_LOCAL_LIBEVHTP "")
    local_library_option(deadbeef   ENABLE_LOCAL_DEADBEEF "ENABLE_PLAYER_DEADBEEF")
endif()

if(OS_WINDOWS)
    option(ENABLE_PLAYER_FOOBAR2000 "Build plugin for foobar2000 player" ON)

    if(ENABLE_PLAYER_FOOBAR2000)
        local_library(foosdk)
    endif()

    local_library_option(zlib   ENABLE_LOCAL_ZLIB "")
endif()

set(COMMON_C_FLAGS    "")
set(COMMON_CXX_FLAGS  "")

if(OS_POSIX)
    set(COMMON_C_FLAGS "${COMMON_C_FLAGS} -fPIC -pthread -D_GNU_SOURCE=1 -D_FILE_OFFSET_BITS=64")
endif()

set(COMMON_CXX_FLAGS "${COMMON_C_FLAGS} ${COMMON_CXX_FLAGS}")

set(CMAKE_C_FLAGS   "${CMAKE_C_FLAGS} ${COMMON_C_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMMON_CXX_FLAGS}")

if(CXX_MSVC)
    if(ENABLE_STATIC_STDLIB)
        foreach(LANG_NAME C CXX)
            foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
                set(VAR_NAME CMAKE_${LANG_NAME}_FLAGS_${BUILD_TYPE})
                string(REPLACE "/MD" "/MT" ${VAR_NAME} "${${VAR_NAME}}")
            endforeach()
        endforeach()
    endif()
endif()

print_status()

add_custom_target(ext_all)

add_subdirectory(extlibs)
add_subdirectory(src)
