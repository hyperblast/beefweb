set(
    JS_CLIENT_SOURCES
    package.json
    webpack.config.js
    src/index.js
    src/enums.js
    src/utils.js
    src/player_client.js
)

add_custom_target(
    js_client
    SOURCES ${JS_CLIENT_SOURCES}
    DEPENDS js_packages ${YARN_INTEGRITY}
)
