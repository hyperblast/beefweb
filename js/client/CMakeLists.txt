include(sources.cmake)

add_custom_target(
    js_client
    SOURCES ${JS_CLIENT_SOURCES}
    DEPENDS ${JS_PACKAGES}
)
