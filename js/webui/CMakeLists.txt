include(sources.cmake)
include(../client/sources.cmake)

list(TRANSFORM JS_CLIENT_SOURCES PREPEND "../client/src/")

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
