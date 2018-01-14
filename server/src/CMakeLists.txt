include(Utils)

add_cxx_compiler_flag(-std=c++11)
add_cxx_compiler_flag(-Wall)
add_cxx_compiler_flag(-Wextra)

if(ENABLE_WERROR)
    add_cxx_compiler_flag(-Werror)
endif()

if(${CMAKE_CXX_COMPILER_ID} STREQUAL Clang)
    add_cxx_compiler_flag(-Wno-potentially-evaluated-expression)
    add_cxx_compiler_flag(-Wno-extern-c-compat)
endif()

add_linker_flag(-Wl,--no-undefined)
add_linker_flag(-Wl,--as-needed)

if(ENABLE_STATIC_STDLIB)
    add_linker_flag(-static-libstdc++)
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
    base64.cpp base64.hpp
    basic_auth_filter.cpp basic_auth_filter.hpp
    browser_controller.cpp browser_controller.hpp
    cache_support_filter.cpp cache_support_filter.hpp
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
    system.cpp system.hpp
    work_queue.cpp work_queue.hpp
)

add_library(core OBJECT ${CORE_SOURCES})

set_target_properties(
    core PROPERTIES
    INTERFACE_LINK_LIBRARIES
    "dl;rt;m;${Boost_LIBRARIES};${LIBB64_LIBRARIES};${ZLIB_LIBRARIES}"
)

add_dependencies(core ext_all)

add_subdirectory(server_evhtp)

if(ENABLE_PLUGIN_DEADBEEF)
    add_subdirectory(plugin_deadbeef)
endif()

if(ENABLE_TESTS)
    add_subdirectory(tests)
endif()
