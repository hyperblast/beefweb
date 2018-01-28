include(Utils)

if(NOT MSVC)
    add_cxx_compiler_flag(-std=c++11)
    add_cxx_compiler_flag(-Wall)
    add_cxx_compiler_flag(-Wextra)

    if(ENABLE_WERROR)
        add_cxx_compiler_flag(-Werror)
    endif()
endif()

if(${CMAKE_CXX_COMPILER_ID} STREQUAL Clang)
    add_cxx_compiler_flag(-Wno-potentially-evaluated-expression)
    add_cxx_compiler_flag(-Wno-extern-c-compat)
endif()

if(POSIX)
    add_definitions(-DMSRV_OS_POSIX=1)

    add_linker_flag(-Wl,--no-undefined)
    add_linker_flag(-Wl,--as-needed)

    if(ENABLE_STATIC_STDLIB)
        add_linker_flag(-static-libstdc++)
    endif()
endif()

if(WIN32)
    add_definitions(-DMSRV_OS_WINDOWS=1)
endif()

find_package(Boost REQUIRED COMPONENTS system filesystem thread)
find_package(Libb64 REQUIRED)
find_package(Nljson REQUIRED)
find_package(ZLIB)

include_directories(
    ${Boost_INCLUDE_DIRS}
    ${LIBB64_INCLUDE_DIRS}
    ${NLJSON_INCLUDE_DIRS}
    ${ZLIB_INCLUDE_DIRS}
)

set(
    CORE_SOURCES
    artwork_controller.cpp artwork_controller.hpp
    base64.cpp base64.hpp
    basic_auth_filter.cpp basic_auth_filter.hpp
    browser_controller.cpp browser_controller.hpp
    cache_support_filter.cpp cache_support_filter.hpp
    chrono.hpp
    compression_filter.cpp compression_filter.hpp
    content_type_map.cpp content_type_map.hpp
    core_types.cpp core_types.hpp
    core_types_json.cpp core_types_json.hpp
    core_types_parsers.cpp core_types_parsers.hpp
    controller.hpp
    defines.hpp
    file_system.hpp
    fnv_hash.hpp
    gzip.cpp gzip.hpp
    host.cpp host.hpp
    http.cpp http.hpp
    json.hpp
    log.cpp log.hpp
    parsing.cpp parsing.hpp
    player_api.cpp player_api.hpp
    player_api_json.cpp player_api_json.hpp
    player_api_parsers.cpp player_api_parsers.hpp
    player_controller.cpp player_controller.hpp
    player_events.cpp player_events.hpp
    playlists_controller.cpp playlists_controller.hpp
    project_info.hpp
    query_controller.cpp query_controller.hpp
    request.cpp request.hpp
    request_filter.cpp request_filter.hpp
    response.cpp response.hpp
    router.cpp router.hpp
    server.cpp server.hpp
    settings.cpp settings.hpp
    static_controller.cpp static_controller.hpp
    string_utils.cpp string_utils.hpp
    system.hpp
    timers.cpp timers.hpp
    work_queue.cpp work_queue.hpp
)

if(POSIX)
    set(
        CORE_SOURCES
        ${CORE_SOURCES}
        file_system_posix.cpp
        system_posix.cpp
    )
endif()

if(WIN32)
    set(
        CORE_SOURCES
        ${CORE_SOURCES}
        file_system_windows.cpp
        system_windows.cpp
    )
endif()

add_library(core OBJECT ${CORE_SOURCES})

if(POSIX)
    set(SYSTEM_LIBRARIES "dl;rt;m")
endif()

if(WIN32)
    set(SYSTEM_LIBRARIES "")
endif()

set_target_properties(
    core PROPERTIES
    INTERFACE_LINK_LIBRARIES
    "${SYSTEM_LIBRARIES};${Boost_LIBRARIES};${LIBB64_LIBRARIES};${ZLIB_LIBRARIES}"
)

add_dependencies(core ext_all)

if(POSIX)
    add_subdirectory(server_evhtp)
endif()

if(WIN32)
    add_subdirectory(server_windows)
endif()

if(ENABLE_PLUGIN_DEADBEEF)
    add_subdirectory(plugin_deadbeef)
endif()

if(ENABLE_TESTS)
    add_subdirectory(tests)
endif()
