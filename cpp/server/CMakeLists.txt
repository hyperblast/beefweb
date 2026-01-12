set(CMAKE_FOLDER cpp)
set(CMAKE_CXX_STANDARD 17)

include(CheckSymbolExists)

if(CXX_GCC OR CXX_CLANG)
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

    if(OS_MAC)
        add_definitions(-DMSRV_OS_MAC=1)
    else()
        add_linker_flag(-Wl,--no-undefined)
        add_linker_flag(-Wl,--as-needed)
    endif()

    check_symbol_exists(pthread_setname_np "pthread.h" HAVE_PTHREAD_SETNAME_NP)

    if(NOT HAVE_PTHREAD_SETNAME_NP)
        check_symbol_exists(pthread_set_name_np "pthread.h" HAVE_PTHREAD_SET_NAME_NP)
    endif()
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

add_definitions(
    -DBOOST_ALL_NO_LIB=1
    -DBOOST_THREAD_PROVIDES_FUTURE_CONTINUATION=1
)

find_package(Boost REQUIRED COMPONENTS system filesystem thread)
find_package(Nljson REQUIRED)
find_package(StringEncoders REQUIRED)
find_package(ZLIB REQUIRED)

configure_file(env_info.hpp.in env_info.hpp)
configure_file(project_info.hpp.in project_info.hpp)

include_directories(
    ${CMAKE_CURRENT_BINARY_DIR}
    ${Boost_INCLUDE_DIRS}
    ${NLJSON_INCLUDE_DIRS}
    ${STRINGENCODERS_INCLUDE_DIRS}
    ${ZLIB_INCLUDE_DIRS}
)

set(
    CORE_SOURCES
    artwork_controller.cpp artwork_controller.hpp
    asio.hpp
    asio_adapters.cpp asio_adapters.hpp
    base64.cpp base64.hpp
    basic_auth_filter.cpp basic_auth_filter.hpp
    beast.hpp
    beast_connection.cpp beast_connection.hpp
    beast_listener.cpp beast_listener.hpp
    beast_request.cpp beast_request.hpp
    beast_server.cpp beast_server.hpp
    browser_controller.cpp browser_controller.hpp
    cache_support_filter.cpp cache_support_filter.hpp
    charset.hpp
    chrono.hpp
    client_config_controller.cpp client_config_controller.hpp
    compression_filter.cpp compression_filter.hpp
    content_type_map.cpp content_type_map.hpp
    core_types.hpp
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
    outputs_controller.cpp outputs_controller.hpp
    parsing.cpp parsing.hpp
    play_queue_controller.cpp
    play_queue_controller.hpp
    player_api.hpp
    player_api_json.cpp player_api_json.hpp
    player_api_parsers.cpp player_api_parsers.hpp
    player_controller.cpp player_controller.hpp
    player_events.cpp player_events.hpp
    playlists_controller.cpp playlists_controller.hpp
    query_controller.cpp query_controller.hpp
    request.cpp request.hpp
    request_filter.cpp request_filter.hpp
    response.cpp response.hpp
    response_headers_filter.cpp response_headers_filter.hpp
    response_sender.cpp response_sender.hpp
    router.cpp router.hpp
    server.cpp server.hpp
    server_core.hpp
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

    set(SYSTEM_LIBRARIES "dl;m")

    if(NOT OS_MAC)
        list(APPEND SYSTEM_LIBRARIES rt)
    endif()
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
    "${SYSTEM_LIBRARIES};${Boost_LIBRARIES};${STRINGENCODERS_LIBRARIES};${ZLIB_LIBRARIES}"
)

add_library(core OBJECT ${CORE_SOURCES})
add_dependencies(core ext_all)

if(ENABLE_DEADBEEF)
    add_subdirectory(deadbeef)
endif()

if(ENABLE_FOOBAR2000)
    add_subdirectory(foobar2000)
endif()

if(ENABLE_TESTS)
    add_subdirectory(tests)

    if(IS_MULTI_CONFIG)
        set(CONFIG_JSON ${CMAKE_CURRENT_BINARY_DIR}/$<CONFIG>/config.json)
    else()
        set(CONFIG_JSON ${CMAKE_CURRENT_BINARY_DIR}/config.json)
    endif()

    file(GENERATE OUTPUT ${CONFIG_JSON} CONTENT "{\"webRoot\":\"${WEBUI_OUTPUT_DIR}\"}")
endif()
