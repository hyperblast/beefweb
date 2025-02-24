include(ProjectInfo)

find_package(foosdk REQUIRED)

include_directories(
    ${FOOSDK_INCLUDE_DIRS}
)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /d2notypeopt")

set(
    FOOBAR2000_PLUGIN_SOURCES
    common.hpp
    main_prefs_page.cpp main_prefs_page.hpp
    player.hpp
    player_control.cpp
    player_misc.cpp
    player_options.cpp player_options.hpp
    player_playlists.cpp
    playlist_mapping.cpp playlist_mapping.hpp
    plugin.cpp plugin.hpp
    prefs_page.cpp prefs_page.hpp
    resource.h resource.rc
    settings.cpp settings.hpp
    utils.cpp utils.hpp
)

set(
    CORE_LIBRARIES_FOOBAR2000
    ${CORE_LIBRARIES}
)

if(ZLIB_DLL_LIBRARIES)
    list(REMOVE_ITEM CORE_LIBRARIES_FOOBAR2000 "${ZLIB_LIBRARIES}")
    list(APPEND CORE_LIBRARIES_FOOBAR2000 "${ZLIB_DLL_LIBRARIES}")
endif()

add_library(
    foobar2000_plugin MODULE
    ${FOOBAR2000_PLUGIN_SOURCES}
    $<TARGET_OBJECTS:core>
)

target_link_libraries(
    foobar2000_plugin
    "${CORE_LIBRARIES_FOOBAR2000};${FOOSDK_LIBRARIES};shlwapi.lib"
)

set_target_properties(
    foobar2000_plugin PROPERTIES
    OUTPUT_NAME "${FOOBAR2000_PLUGIN_FILE}"
)
