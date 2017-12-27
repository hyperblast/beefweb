find_package(Deadbeef REQUIRED)

include_directories(
    ${DEADBEEF_INCLUDE_DIRS}
)

set(
    PLUGIN_DEADBEEF_SOURCES
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
    plugin_deadbeef MODULE
    ${PLUGIN_DEADBEEF_SOURCES}
    $<TARGET_OBJECTS:core>
    $<TARGET_OBJECTS:server>
)

target_link_libraries(
    plugin_deadbeef
    $<TARGET_PROPERTY:core,INTERFACE_LINK_LIBRARIES>
    $<TARGET_PROPERTY:server,INTERFACE_LINK_LIBRARIES>
)

set_target_properties(
    plugin_deadbeef PROPERTIES
    PREFIX ""
    OUTPUT_NAME "${PROJECT_ID}"
    LINK_FLAGS "-Wl,-version-script,${CMAKE_CURRENT_SOURCE_DIR}/symbols"
)

add_dependencies(plugin_deadbeef extlibs)

if(ENABLE_TESTS)
    add_library(
        plugin_deadbeef_dummy_gui MODULE
        dummy_gui.c
    )

    set_target_properties(
        plugin_deadbeef_dummy_gui PROPERTIES
        PREFIX ""
        OUTPUT_NAME "ddb_gui_dummy"
    )

    add_dependencies(plugin_deadbeef_dummy_gui extlibs)
endif()