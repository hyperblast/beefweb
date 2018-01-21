find_package(Catch REQUIRED)
include_directories(${CATCH_INCLUDE_DIR})

set(
    TEST_SOURCES
    main.cpp
    base64_tests.cpp
    fnv_hash_tests.cpp
    router_tests.cpp
    server_tests.cpp
    timers_tests.cpp
)

add_executable(
    server_tests
    ${TEST_SOURCES}
    $<TARGET_OBJECTS:core>
    $<TARGET_OBJECTS:server>
)

target_link_libraries(
    server_tests
    $<TARGET_PROPERTY:core,INTERFACE_LINK_LIBRARIES>
    $<TARGET_PROPERTY:server,INTERFACE_LINK_LIBRARIES>
)
