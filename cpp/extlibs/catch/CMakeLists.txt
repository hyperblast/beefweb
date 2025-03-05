include(ExternalProject)

ExternalProject_Add(
    ext_catch
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/catchorg/Catch2/releases/download/v2.13.10/catch.hpp
    URL_HASH
        SHA256=3725c0f0a75f376a5005dde31ead0feb8f7da7507644c201b814443de8355170
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/catch
    DOWNLOAD_NO_EXTRACT 1
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND
        ${CMAKE_COMMAND} -E copy_if_different <DOWNLOADED_FILE> ${EXTLIB_INSTALL_DIR}/include/catch.hpp
    LOG_DOWNLOAD 0 LOG_UPDATE 0 LOG_CONFIGURE 0 LOG_BUILD 0 LOG_INSTALL 1
)

extlib_target(ext_catch)
