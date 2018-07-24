include(Utils)

if(CXX_GCC OR CXX_CLANG)
    add_cxx_compiler_flag(-std=c++14)
    add_cxx_compiler_flag(-Wall)
    add_cxx_compiler_flag(-Wextra)

    if(ENABLE_WERROR)
        add_cxx_compiler_flag(-Werror)
    endif()

    if(ENABLE_STATIC_STDLIB)
        add_linker_flag(-static-libstdc++)
    endif()
endif()

if(CXX_CLANG)
    add_cxx_compiler_flag(-Wno-potentially-evaluated-expression)
    add_cxx_compiler_flag(-Wno-extern-c-compat)
endif()

if(CXX_MSVC)
    add_definitions(-D_CRT_SECURE_NO_WARNINGS)
endif()

if(OS_POSIX)
    add_definitions(-DMSRV_OS_POSIX=1)

    add_linker_flag(-Wl,--no-undefined)
    add_linker_flag(-Wl,--as-needed)
endif()

if(OS_WINDOWS)
    set(WINVER 0x0601) # Windows 7
    add_definitions(
        -DMSRV_OS_WINDOWS=1
        -D_UNICODE
        -DUNICODE
        -DSTRICT
        -DWINVER=${WINVER}
        -D_WIN32_WINNT=${WINVER}
    )
endif()

find_package(Boost REQUIRED COMPONENTS system filesystem thread)
find_package(Libb64 REQUIRED)
find_package(Nljson REQUIRED)
find_package(ZLIB REQUIRED)

include_directories(
    ${Boost_INCLUDE_DIRS}
    ${LIBB64_INCLUDE_DIRS}
    ${NLJSON_INCLUDE_DIRS}
    ${ZLIB_INCLUDE_DIRS}
)

set(
    CORE_SOURCES
    artwork_controller.cpp artwork_controller.hpp
    asio.hpp
    asio_adapters.cpp asio_adapters.hpp
    base64.cpp base64.hpp
    basic_auth_filter.cpp basic_auth_filter.hpp
    boost_locks_compat.hpp
    browser_controller.cpp browser_controller.hpp
    cache_support_filter.cpp cache_support_filter.hpp
    charset.hpp
    chrono.hpp
    compression_filter.cpp compression_filter.hpp
    content_type_map.cpp content_type_map.hpp
    core_types.cpp core_types.hpp
    core_types_json.cpp core_types_json.hpp
    core_types_parsers.cpp core_types_parsers.hpp
    controller.hpp
    defines.hpp
    file_system.cpp file_system.hpp
    fnv_hash.hpp
    gzip.cpp gzip.hpp
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
    response_formatter.cpp response_formatter.hpp
    router.cpp router.hpp
    server.cpp server.hpp
    server_core.cpp server_core.hpp
    server_host.cpp server_host.hpp
    server_thread.cpp server_thread.hpp
    settings.cpp settings.hpp
    static_controller.cpp static_controller.hpp
    string_utils.cpp string_utils.hpp
    system.cpp system.hpp
    timers.cpp timers.hpp
    work_queue.cpp work_queue.hpp
)

if(OS_POSIX)
    set(
        CORE_SOURCES
        ${CORE_SOURCES}
        charset_posix.cpp
        file_system_posix.cpp
        system_posix.cpp
    )

    set(SYSTEM_LIBRARIES "dl;rt;m")
endif()

if(OS_WINDOWS)
    set(
        CORE_SOURCES
        ${CORE_SOURCES}
        charset_windows.cpp
        file_system_windows.cpp
        safe_windows.h
        system_windows.cpp
    )

    set(SYSTEM_LIBRARIES "")
endif()

set(
    CORE_LIBRARIES
    "${SYSTEM_LIBRARIES};${Boost_LIBRARIES};${LIBB64_LIBRARIES};${ZLIB_LIBRARIES}"
)

add_library(core OBJECT ${CORE_SOURCES})
add_dependencies(core ext_all)

if(OS_POSIX)
    add_subdirectory(server_evhtp)
endif()

if(OS_WINDOWS)
    add_subdirectory(server_windows)
endif()

if(ENABLE_PLAYER_DEADBEEF)
    add_subdirectory(player_deadbeef)
endif()

if(ENABLE_PLAYER_FOOBAR2000)
    add_subdirectory(player_foobar2000)
endif()

if(ENABLE_TESTS)
    add_subdirectory(tests)
endif()
