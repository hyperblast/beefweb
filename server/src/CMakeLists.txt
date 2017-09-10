set(
    CMAKE_CXX_FLAGS
    "${CMAKE_CXX_FLAGS} -std=c++11 -Wall -Wextra"
)

set(
    CMAKE_EXE_LINKER_FLAGS
    "${CMAKE_EXE_LINKER_FLAGS} -Wl,--no-undefined -Wl,--as-needed"
)

set(
    CMAKE_MODULE_LINKER_FLAGS
    "${CMAKE_MODULE_LINKER_FLAGS} -Wl,--no-undefined -Wl,--as-needed"
)

if(ENABLE_WERROR)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Werror")
endif()

if(${CMAKE_CXX_COMPILER_ID} STREQUAL Clang)
    set(
        CMAKE_CXX_FLAGS
        "${CMAKE_CXX_FLAGS} -Wno-unknown-warning-option -Wno-potentially-evaluated-expression -Wno-extern-c-compat"
    )
endif()

find_package(Boost REQUIRED COMPONENTS system filesystem thread)
find_package(Nljson REQUIRED)

include_directories(
    ${Boost_INCLUDE_DIRS}
    ${NLJSON_INCLUDE_DIRS}
)

set(
    CORE_SOURCES
    artwork_controller.cpp artwork_controller.hpp
    browser_controller.cpp browser_controller.hpp
    content_type_map.cpp content_type_map.hpp
    controller.hpp
    defines.hpp
    file_system.cpp file_system.hpp
    fnv_hash.hpp
    host.cpp host.hpp
    http.cpp http.hpp
    json.hpp
    log.cpp log.hpp
    player_api.cpp player_api.hpp
    player_api_json.cpp player_api_json.hpp
    player_controller.cpp player_controller.hpp
    player_events.cpp player_events.hpp
    playlists_controller.cpp playlists_controller.hpp
    query_controller.cpp query_controller.hpp
    request.cpp request.hpp
    request_filter.cpp request_filter.hpp
    response.cpp response.hpp
    router.cpp router.hpp
    server.cpp server.hpp
    settings.cpp settings.hpp
    static_controller.cpp static_controller.hpp
    system.cpp system.hpp
    util.cpp util.hpp
    util_json.cpp util_json.hpp
    work_queue.cpp work_queue.hpp
)

add_library(core OBJECT ${CORE_SOURCES})

set_target_properties(
    core PROPERTIES
    INTERFACE_LINK_LIBRARIES "dl;rt;m;${Boost_LIBRARIES}"
)

add_dependencies(core deps)

add_subdirectory(server_evhtp)
add_subdirectory(plugin_deadbeef)

if(ENABLE_TESTS)

    find_package(Catch REQUIRED)
    include_directories(${CATCH_INCLUDE_DIR})
    
    set(
        TEST_SOURCES
        run_tests.cpp
        fnv_hash_tests.cpp
        router_tests.cpp
        server_tests.cpp
    )

    add_executable(
        run_tests
        ${TEST_SOURCES}
        $<TARGET_OBJECTS:core>
        $<TARGET_OBJECTS:server>
    )

    target_link_libraries(
        run_tests
        $<TARGET_PROPERTY:core,INTERFACE_LINK_LIBRARIES>
        $<TARGET_PROPERTY:server,INTERFACE_LINK_LIBRARIES>
    )

endif()
