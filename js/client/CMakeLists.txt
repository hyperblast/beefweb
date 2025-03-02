include(sources.cmake)

set(
    JS_CLIENT_SOURCES
    ${JS_CLIENT_SOURCES}
    webpack.config.js
)

add_custom_target(
    js_client
    SOURCES ${JS_CLIENT_SOURCES}
    DEPENDS js_packages ${YARN_INTEGRITY}
)
