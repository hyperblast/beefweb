include(ProjectInfo)

find_package(foosdk REQUIRED)

include_directories(
    ${FOOSDK_INCLUDE_DIRS}
)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /d2notypeopt")

set(
    FOOBAR2000_PLUGIN_SOURCES
    common.hpp
    log.cpp log.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_options.cpp
    player_playlists.cpp
    plugin.cpp plugin.hpp
    settings.cpp settings.hpp
    work_queue.cpp work_queue.hpp
)

add_library(
    foobar2000_plugin MODULE
    ${FOOBAR2000_PLUGIN_SOURCES}
    $<TARGET_OBJECTS:core>
    $<TARGET_OBJECTS:server>
)

target_link_libraries(
    foobar2000_plugin
    "${CORE_LIBRARIES};${SERVER_LIBRARIES};${FOOSDK_LIBRARIES}"
)

set_target_properties(
    foobar2000_plugin PROPERTIES
    OUTPUT_NAME "${FOOBAR2000_PLUGIN_FILE}"
)
