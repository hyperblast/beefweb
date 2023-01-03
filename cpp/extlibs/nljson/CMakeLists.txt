include(ExternalProject)

ExternalProject_Add(
    ext_nljson
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/nlohmann/json/releases/download/v3.9.0/json.hpp
    URL_HASH
        SHA256=d8089d52d285ef2c5368eb39ae665b39ea464206b1ca674a88a915c0245ff4f0
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
