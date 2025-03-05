include(ExternalProject)

ExternalProject_Add(
    ext_deadbeef
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/hyperblast/deadbeef_headers/archive/88517e52ce5647953328bff9de051db658c1f1f1.zip
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/deadbeef
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND
        ${CMAKE_COMMAND} -E copy_directory <SOURCE_DIR>/include/ ${EXTLIB_INSTALL_DIR}/include/
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 0 LOG_BUILD 0 LOG_INSTALL 1
)

extlib_target(ext_deadbeef)
