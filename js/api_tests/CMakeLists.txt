include(sources.cmake)

add_custom_target(
    api_tests
    SOURCES ${API_TESTS_SOURCES}
    DEPENDS js_packages ${YARN_INTEGRITY}
)
