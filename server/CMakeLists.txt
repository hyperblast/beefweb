cmake_minimum_required(VERSION 3.6)

project(beefweb)

set(PROJECT_ID beefweb)

option(ENABLE_PLUGIN_DEADBEEF   "Build DeaDBeeF plugin" ON)
option(ENABLE_TESTS             "Build tests" OFF)
option(ENABLE_WERROR            "Treat warnings as errors" OFF)
option(USE_SYSTEM_LIBS          "Build with system libraries" OFF)

set(COMMON_C_FLAGS    "-fPIC -pthread -D_GNU_SOURCE=1 -D_FILE_OFFSET_BITS=64")
set(COMMON_CXX_FLAGS  "${COMMON_C_FLAGS}")

set(CMAKE_C_FLAGS   "${CMAKE_C_FLAGS} ${COMMON_C_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMMON_CXX_FLAGS}")

add_custom_target(extlibs)

set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake;${CMAKE_MODULE_PATH}")

if(USE_SYSTEM_LIBS)
    set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/system_libs;${CMAKE_MODULE_PATH}")
else()
    set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/local_libs;${CMAKE_MODULE_PATH}")
    set(EXTLIB_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/extlibs)
    set(EXTLIB_INSTALL_DIR ${CMAKE_CURRENT_BINARY_DIR}/extlibs/root)
    add_subdirectory(extlibs)
endif()

add_subdirectory(src)
