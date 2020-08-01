include(ExternalProject)

ExternalProject_Add(
    ext_catch
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/catchorg/Catch2/releases/download/v2.13.0/catch.hpp
    URL_HASH
        SHA256=a1f66a0871edcb23231cba4b2fbf1bd7afa91488beed389c52a3bd641b89dae4
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/catch
    DOWNLOAD_NO_EXTRACT 1
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND
        ${CMAKE_COMMAND} -E copy_if_different <DOWNLOADED_FILE> ${EXTLIB_INSTALL_DIR}/include/catch.hpp
    LOG_DOWNLOAD 0 LOG_UPDATE 0 LOG_CONFIGURE 0 LOG_BUILD 0 LOG_INSTALL 1
)

add_dependencies(ext_all ext_catch)
