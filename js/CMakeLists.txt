set(JS_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}")

set(YARN_NAMES yarn yarnpkg)

if(HOST_OS_WINDOWS)
    list(TRANSFORM YARN_NAMES APPEND .cmd)
endif()

find_program(YARN NAMES ${YARN_NAMES} REQUIRED)

set(
    YARN_INTEGRITY
    ${CMAKE_CURRENT_SOURCE_DIR}/node_modules/.yarn-integrity
)

set(
    PACKAGE_JSON_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/package.json
    ${CMAKE_CURRENT_SOURCE_DIR}/api_tests/package.json
    ${CMAKE_CURRENT_SOURCE_DIR}/client/package.json
    ${CMAKE_CURRENT_SOURCE_DIR}/webui/package.json
)

add_custom_command(
    OUTPUT ${YARN_INTEGRITY}
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/yarn.lock
    DEPENDS ${PACKAGE_JSON_FILES}
    COMMAND ${YARN} install --non-interactive
    COMMAND ${CMAKE_COMMAND} -E touch_nocreate ${YARN_INTEGRITY}
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    VERBATIM
)

add_custom_target(js_packages DEPENDS ${YARN_INTEGRITY})

if(ENABLE_TESTS)
    add_subdirectory(api_tests)
endif()

add_subdirectory(client)
add_subdirectory(webui)
