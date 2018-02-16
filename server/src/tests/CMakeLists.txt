find_package(Catch REQUIRED)
include_directories(${CATCH_INCLUDE_DIR})

set(
    RUNNER_SOURCES
    runner.cpp
    test_main.hpp
    base64_tests.cpp
    fnv_hash_tests.cpp
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
    server_tests
    ${RUNNER_SOURCES}
    $<TARGET_OBJECTS:core>
    $<TARGET_OBJECTS:server>
)

target_link_libraries(
    server_tests
    $<TARGET_PROPERTY:core,INTERFACE_LINK_LIBRARIES>
    $<TARGET_PROPERTY:server,INTERFACE_LINK_LIBRARIES>
)

add_executable(
    echo_server
    ${ECHO_SERVER_SOURCES}
    $<TARGET_OBJECTS:core>
    $<TARGET_OBJECTS:server>
)

target_link_libraries(
    echo_server
    $<TARGET_PROPERTY:core,INTERFACE_LINK_LIBRARIES>
    $<TARGET_PROPERTY:server,INTERFACE_LINK_LIBRARIES>
)
