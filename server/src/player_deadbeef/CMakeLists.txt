include(ProjectInfo)

find_package(Deadbeef REQUIRED)

include_directories(
    ${DEADBEEF_INCLUDE_DIRS}
)

set(
    DEADBEEF_PLUGIN_SOURCES
    add_items_scope.cpp add_items_scope.hpp
    artwork_request.cpp artwork_request.hpp
    common.cpp common.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_playlists.cpp
    playlist_mapping.cpp playlist_mapping.hpp
    plugin.cpp plugin.hpp
    utils.cpp utils.hpp
)

add_library(
    deadbeef_plugin MODULE
    ${DEADBEEF_PLUGIN_SOURCES}
    $<TARGET_OBJECTS:core>
)

target_link_libraries(
    deadbeef_plugin
    "${CORE_LIBRARIES}"
)

set_target_properties(
    deadbeef_plugin PROPERTIES
    PREFIX ""
    OUTPUT_NAME "${DEADBEEF_PLUGIN_FILE}"
    LINK_FLAGS "-Wl,-version-script,${CMAKE_CURRENT_SOURCE_DIR}/symbols"
)

add_dependencies(deadbeef_plugin ext_all)

if(ENABLE_TESTS)
    add_library(
        deadbeef_plugin_dummy_gui MODULE
        dummy_gui.c
    )

    set_target_properties(
        deadbeef_plugin_dummy_gui PROPERTIES
        PREFIX ""
        OUTPUT_NAME "ddb_gui_dummy"
    )

    add_dependencies(deadbeef_plugin_dummy_gui ext_all)

    add_library(
        deadbeef_plugin_nullout2 MODULE
        nullout2.c
    )

    set_target_properties(
        deadbeef_plugin_nullout2 PROPERTIES
        PREFIX ""
        OUTPUT_NAME "nullout2"
    )

    add_dependencies(deadbeef_plugin_nullout2 ext_all)
endif()
