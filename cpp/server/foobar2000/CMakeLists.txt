find_package(foosdk REQUIRED)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${FOOSDK_INCLUDE_DIRS}
)

if(CXX_MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /d2notypeopt")
endif()

set(
    PLUGIN_SOURCES
    common.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_options.cpp player_options.hpp
    player_playlists.cpp
    playlist_mapping.cpp playlist_mapping.hpp
    plugin.cpp plugin.hpp
    plugin_settings.cpp plugin_settings.hpp
    utils.cpp utils.hpp
)

if(OS_WINDOWS)
    set(
        PLUGIN_SOURCES
        ${PLUGIN_SOURCES}
        windows/main_prefs_page.cpp windows/main_prefs_page.hpp
        windows/permissions_prefs_page.cpp windows/permissions_prefs_page.hpp
        windows/prefs_page.cpp windows/prefs_page.hpp
        windows/resource.h windows/resource.rc
    )
endif()

set(
    PLUGIN_LIBRARIES
    "${CORE_LIBRARIES};${FOOSDK_LIBRARIES}"
)

if(OS_WINDOWS)
    list(APPEND PLUGIN_LIBRARIES shlwapi.lib)

    if(ZLIB_DLL_LIBRARIES)
        list(REMOVE_ITEM PLUGIN_LIBRARIES "${ZLIB_LIBRARIES}")
        list(APPEND PLUGIN_LIBRARIES "${ZLIB_DLL_LIBRARIES}")
    endif()
endif()

if(OS_MAC)
    list(APPEND PLUGIN_LIBRARIES "-framework Cocoa")
endif()

add_library(
    foobar2000_plugin MODULE
    ${PLUGIN_SOURCES}
    $<TARGET_OBJECTS:core>
)

target_link_libraries(
    foobar2000_plugin
    ${PLUGIN_LIBRARIES}
)

set_target_properties(
    foobar2000_plugin PROPERTIES
    OUTPUT_NAME "${FOOBAR2000_PLUGIN_FILE}"
)

if(OS_MAC)
    set_target_properties(
        foobar2000_plugin PROPERTIES
        BUNDLE ON
        BUNDLE_EXTENSION component
    )
endif()

install(
    TARGETS foobar2000_plugin
    RUNTIME DESTINATION .
    LIBRARY DESTINATION .
    COMPONENT foobar2000_plugin
)
