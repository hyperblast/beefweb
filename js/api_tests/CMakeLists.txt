include(sources.cmake)

add_custom_target(
    api_tests
    SOURCES ${API_TESTS_SOURCES}
    DEPENDS ${JS_PACKAGES}
)
