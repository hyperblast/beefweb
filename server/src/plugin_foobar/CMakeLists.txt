include(ProjectInfo)

find_package(foosdk REQUIRED)

include_directories(
    ${FOOSDK_INCLUDE_DIRS}
)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /d2notypeopt")

set(
    PLUGIN_FOOBAR_SOURCES
    common.hpp
    log.cpp log.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_options.cpp
    player_playlists.cpp
    plugin.cpp plugin.hpp
    settings.cpp settings.hpp
)

add_library(
    plugin_foobar MODULE
    ${PLUGIN_FOOBAR_SOURCES}
    $<TARGET_OBJECTS:core>
    $<TARGET_OBJECTS:server>
)

target_link_libraries(
    plugin_foobar
    "${CORE_LIBRARIES};${SERVER_LIBRARIES};${FOOSDK_LIBRARIES}"
)

set_target_properties(
    plugin_foobar PROPERTIES
    OUTPUT_NAME "${PLUGIN_FOOBAR_FILE}"
)
