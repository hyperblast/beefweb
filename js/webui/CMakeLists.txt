include(ProjectInfo)

set(
    WEBUI_SOURCES
    .babelrc
    package.json
    webpack.config.js
    src/about_box.js
    src/album_art_viewer.js
    src/app.js
    src/app_model.js
    src/columns.js
    src/columns_settings.js
    src/columns_settings_menu.js
    src/columns_settings_model.js
    src/control_bar.js
    src/css_settings_controller.js
    src/data_source.js
    src/data_table.js
    src/defaults_settings.js
    src/dialogs.js
    src/dom_utils.js
    src/dropdown.js
    src/elements.js
    src/file_browser_header.js
    src/file_browser.js
    src/file_browser_model.js
    src/general_settings.js
    src/index.html
    src/index.js
    src/loader.gif
    src/media_size_controller.js
    src/media_theme_controller.js
    src/model_binding.js
    src/navigation_model.js
    src/notification_group.js
    src/notification_model.js
    src/output_settings.js
    src/output_settings_model.js
    src/play_queue_model.js
    src/playback_control.js
    src/playback_info_bar.js
    src/player_features.js
    src/player_model.js
    src/playlist_content.js
    src/playlist_menu.js
    src/playlist_model.js
    src/playlist_switcher.js
    src/position_control.js
    src/request_handler.js
    src/scroll_manager.js
    src/service_context.js
    src/setting_editor.js
    src/settings_content.js
    src/settings_header.js
    src/settings_model.js
    src/settings_model_base.js
    src/settings_store.js
    src/status_bar.js
    src/style.less
    src/timer.js
    src/touch_mode_controller.js
    src/urls.js
    src/utils.js
    src/view_switcher.js
    src/volume_control.js
    src/window_controller.js
)

set(
    JS_CLIENT_SOURCES
    enums.js
    index.js
    player_client.js
    utils.js
)

list(TRANSFORM JS_CLIENT_SOURCES PREPEND "${JS_SOURCE_DIR}/client/src/")

if(ENABLE_TESTS)
    set(
        WEBUI_SOURCES
        ${WEBUI_SOURCES}
        src/sandbox/index.js
        src/tests/index.html
        src/tests/index.js
    )
endif()

get_property(IS_MULTI_CONFIG GLOBAL PROPERTY GENERATOR_IS_MULTI_CONFIG)

if(IS_MULTI_CONFIG)
    set(WEBUI_OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/$<CONFIG>)
else()
    set(WEBUI_OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/output)
endif()

set(
    WEBUI_OUTPUT_FILES
    ${WEBUI_OUTPUT_DIR}/bundle.js
)

set(
    WEBUI_BUILD_ARGS
    --env "outputDir=${WEBUI_OUTPUT_DIR}"
    --env "buildType=$<CONFIG>"
    --env "$<IF:$<BOOL:${ENABLE_TESTS}>,tests,noTests>"
    --env saveConfig
)

add_custom_command(
    OUTPUT ${WEBUI_OUTPUT_FILES}
    DEPENDS ${WEBUI_SOURCES} ${JS_CLIENT_SOURCES} ${YARN_INTEGRITY} js_packages
    COMMAND ${YARN} build ${WEBUI_BUILD_ARGS}
    COMMAND ${CMAKE_COMMAND} -E touch_nocreate ${WEBUI_OUTPUT_FILES}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    VERBATIM
)

add_custom_target(
    webui ALL
    DEPENDS ${WEBUI_OUTPUT_FILES}
    SOURCES ${WEBUI_SOURCES}
)

set(
    LICENSES_FILE
    ${WEBUI_OUTPUT_DIR}/${WEBUI_LICENSES_FILE}
)

add_custom_command(
    OUTPUT ${LICENSES_FILE}
    DEPENDS ${EXTLIB_LICENSES_FILE} ${YARN_INTEGRITY} js_packages
    COMMAND ${CMAKE_COMMAND} -E make_directory ${WEBUI_OUTPUT_DIR}
    COMMAND ${CMAKE_COMMAND} -E copy ${EXTLIB_LICENSES_FILE} ${LICENSES_FILE}
    COMMAND ${YARN} licenses generate-disclaimer --silent --prod --cwd ${CMAKE_CURRENT_SOURCE_DIR} >> ${LICENSES_FILE}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    VERBATIM
)

add_custom_target(
    licenses_file ALL
    DEPENDS ${LICENSES_FILE}
)

function(install_webui COMP DIR)
    install(
        DIRECTORY "${WEBUI_OUTPUT_DIR}/"
        DESTINATION "${DIR}/${WEBUI_ROOT}"
        COMPONENT ${COMP}
        PATTERN tests EXCLUDE
        PATTERN sandbox EXCLUDE
    )
endfunction()

if(ENABLE_DEADBEEF)
    install_webui(deadbeef_plugin ${DEADBEEF_LIB_DIR})
endif()

if(ENABLE_FOOBAR2000)
    install_webui(foobar2000_plugin .)
endif()
