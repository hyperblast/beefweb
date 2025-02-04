set(
    API_TESTS_SOURCES
    package.json
    src/artwork_api_tests.js
    src/authentication_tests.js
    src/browser_api_tests.js
    src/deadbeef/player_controller.js
    src/deadbeef/test_context.js
    src/event_expectation.js
    src/foobar2000/player_controller.js
    src/foobar2000/test_context.js
    src/http_features_tests.js
    src/main.js
    src/play_queue_api_tests.js
    src/player_api_tests.js
    src/playlists_api_tests.js
    src/query_api_tests.js
    src/request_handler.js
    src/static_files_tests.js
    src/test_context.js
    src/test_env.js
    src/test_player_client.js
    src/utils.js
)

add_custom_target(
    api_tests
    SOURCES ${API_TESTS_SOURCES}
    DEPENDS js_packages ${YARN_INTEGRITY}
)
