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
find_package(Libevent REQUIRED)
find_package(Libevhtp REQUIRED)
find_package(Nljson REQUIRED)

include_directories(
    ${Boost_INCLUDE_DIRS}
    ${LIBEVENT_INCLUDE_DIRS}
    ${LIBEVHTP_INCLUDE_DIRS}
    ${NLJSON_INCLUDE_DIRS}
)

set(
    MAIN_LIBRARIES
    dl rt m
    ${Boost_LIBRARIES}
    ${LIBEVHTP_LIBRARIES}
    ${LIBEVENT_LIBRARIES}
)

set(
    MAIN_SOURCES
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
    libevent.cpp libevent.hpp
    libevhtp.cpp libevhtp.hpp
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
    server_evhtp.cpp server_evhtp.hpp
    settings.cpp settings.hpp
    static_controller.cpp static_controller.hpp
    system.cpp system.hpp
    util.cpp util.hpp
    util_json.cpp util_json.hpp
    work_queue.cpp work_queue.hpp
)

add_library(main OBJECT ${MAIN_SOURCES})
add_dependencies(main deps)

add_subdirectory(deadbeef)

if(ENABLE_TESTS)

    set(
        TEST_SOURCES
        run_tests.cpp
        fnv_hash_tests.cpp
        router_tests.cpp
        server_tests.cpp
    )

    find_package(Catch REQUIRED)
    include_directories(${CATCH_INCLUDE_DIR})

    add_executable(run_tests ${TEST_SOURCES} $<TARGET_OBJECTS:main>)
    target_link_libraries(run_tests ${MAIN_LIBRARIES})

endif()
