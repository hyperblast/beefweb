include(ExternalProject)

ExternalProject_Add(
    nljson
    PREFIX
        ${DEPS_INSTALL_DIR}
    URL
        https://github.com/nlohmann/json/releases/download/v2.1.1/json.hpp
    URL_HASH
        SHA256=faa2321beb1aa7416d035e7417fcfa59692ac3d8c202728f9bcc302e2d558f57
    DOWNLOAD_DIR
        ${DEPS_CACHE_DIR}/nljson
    DOWNLOAD_NO_EXTRACT 1
    CONFIGURE_COMMAND
        ${CMAKE_COMMAND} -E echo "No configure required"
    BUILD_COMMAND
        ${CMAKE_COMMAND} -E echo "No build required"
    INSTALL_COMMAND
        ${CMAKE_COMMAND} -E copy_if_different <DOWNLOADED_FILE> <INSTALL_DIR>/include/nlohmann/json.hpp
    LOG_DOWNLOAD 0 LOG_UPDATE 0 LOG_CONFIGURE 0 LOG_BUILD 0 LOG_INSTALL 1
)

add_dependencies(deps nljson)
