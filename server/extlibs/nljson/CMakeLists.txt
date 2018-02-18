include(ExternalProject)

ExternalProject_Add(
    ext_nljson
    PREFIX
        ${EXTLIB_PREFIX_DIR}
    URL
        https://github.com/nlohmann/json/releases/download/v3.0.1/json.hpp
    URL_HASH
        SHA256=c9b3591f1bb94e723a0cd7be861733a3a555b234ef132be1e9027a0364118c4c
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
