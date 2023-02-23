find_package(Catch REQUIRED)
include_directories(${CATCH_INCLUDE_DIR})

set(
    RUNNER_SOURCES
    runner.cpp
    test_main.hpp
    base64_tests.cpp
    fnv_hash_tests.cpp
    http_tests.cpp
    parsing_tests.cpp
    router_tests.cpp
    server_tests.cpp
    timers_tests.cpp
)

set(
    ECHO_SERVER_SOURCES
    echo_server.cpp
    test_main.hpp
)

add_executable(
    core_tests
    ${RUNNER_SOURCES}
    $<TARGET_OBJECTS:core>
)

target_link_libraries(
    core_tests
    "${CORE_LIBRARIES}"
)

add_executable(
    echo_server
    ${ECHO_SERVER_SOURCES}
    $<TARGET_OBJECTS:core>
)

target_link_libraries(
    echo_server
    "${CORE_LIBRARIES}"
)
