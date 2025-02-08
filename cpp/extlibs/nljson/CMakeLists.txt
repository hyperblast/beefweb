include(ExternalProject)

ExternalProject_Add(
    ext_nljson
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp
    URL_HASH
        SHA256=9bea4c8066ef4a1c206b2be5a36302f8926f7fdc6087af5d20b417d0cf103ea6
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/nljson
    DOWNLOAD_NO_EXTRACT 1
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND
        ${CMAKE_COMMAND} -E copy_if_different <DOWNLOADED_FILE> ${EXTLIB_INSTALL_DIR}/include/nlohmann/json.hpp
    LOG_DOWNLOAD 0 LOG_UPDATE 0 LOG_CONFIGURE 0 LOG_BUILD 0 LOG_INSTALL 1
)

add_dependencies(ext_all ext_nljson)
