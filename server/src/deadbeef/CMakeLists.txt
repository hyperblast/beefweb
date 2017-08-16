find_package(Deadbeef REQUIRED)

include_directories(
    ${DEADBEEF_INCLUDE_DIRS}
)

set(
    DEADBEEF_PLUGIN_SOURCES
    add_items_scope.cpp add_items_scope.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_options.cpp player_options.hpp
    player_playlists.cpp
    playlist_mapping.cpp playlist_mapping.hpp
    plugin.cpp plugin.hpp
    util.cpp util.hpp
)

add_library(
    deadbeef_plugin MODULE ${DEADBEEF_PLUGIN_SOURCES} $<TARGET_OBJECTS:main>
)

target_link_libraries(
    deadbeef_plugin ${MAIN_LIBRARIES}
)

set_target_properties(
    deadbeef_plugin PROPERTIES PREFIX "" OUTPUT_NAME "${PROJECT_ID}"
)

