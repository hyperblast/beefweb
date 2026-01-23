find_package(Deadbeef REQUIRED)

include_directories(
    ${DEADBEEF_INCLUDE_DIRS}
)

set(
    PLUGIN_SOURCES
    add_items_scope.cpp add_items_scope.hpp
    artwork_fetcher_v1.cpp artwork_fetcher_v2.cpp artwork_fetcher.hpp
    common.cpp common.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_options.cpp player_options.hpp
    player_playlists.cpp
    playlist_mapping_impl.cpp playlist_mapping_impl.hpp
    plugin.cpp plugin.hpp
    utils.cpp utils.hpp
)

add_library(
    deadbeef_plugin MODULE
    ${PLUGIN_SOURCES}
    $<TARGET_OBJECTS:core>
)

target_link_libraries(
    deadbeef_plugin
    ${CORE_LIBRARIES}
)

set_target_properties(
    deadbeef_plugin PROPERTIES
    PREFIX ""
    SUFFIX ${SHARED_LIB_SUFFIX}
    OUTPUT_NAME "${DEADBEEF_PLUGIN_FILE}"
)

if(NOT OS_MAC)
    configure_file(linker_script.in linker_script)

    set_target_properties(
        deadbeef_plugin PROPERTIES
        LINK_FLAGS "-Wl,-version-script,${CMAKE_CURRENT_BINARY_DIR}/linker_script"
    )
endif()

add_dependencies(deadbeef_plugin ext_all)

install(
    TARGETS deadbeef_plugin
    LIBRARY DESTINATION ${DEADBEEF_INSTALL_DIR}
    COMPONENT deadbeef_plugin
)

if(ENABLE_TESTS)
    add_library(
        deadbeef_plugin_nullout2 MODULE
        nullout2.c
    )

    set_target_properties(
        deadbeef_plugin_nullout2 PROPERTIES
        PREFIX ""
        SUFFIX ${SHARED_LIB_SUFFIX}
        OUTPUT_NAME "nullout2"
    )

    add_dependencies(deadbeef_plugin_nullout2 ext_all)

    if(NOT MAC_OS)
        add_library(
            deadbeef_plugin_dummy_gui MODULE
            dummy_gui.c
        )

        set_target_properties(
            deadbeef_plugin_dummy_gui PROPERTIES
            PREFIX ""
            SUFFIX ${SHARED_LIB_SUFFIX}
            OUTPUT_NAME "ddb_gui_dummy"
        )

        add_dependencies(deadbeef_plugin_dummy_gui ext_all)
    endif()
endif()
