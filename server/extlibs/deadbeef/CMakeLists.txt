include(ExternalProject)

ExternalProject_Add(
    ext_deadbeef
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        http://sourceforge.net/projects/deadbeef/files/deadbeef-0.7.2.tar.bz2
    URL_HASH
        SHA256=8a63abdf00c2f37c33e018ae0b39d391873e037434074b84bb47381bf283c884
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/deadbeef
    PATCH_COMMAND
        ${EXTLIB_PATCHER} deadbeef
    CONFIGURE_COMMAND ""
    BUILD_COMMAND ""
    INSTALL_COMMAND
        ${CMAKE_COMMAND} -E copy_if_different
            <SOURCE_DIR>/deadbeef.h
            ${EXTLIB_INSTALL_DIR}/include/deadbeef/deadbeef.h
    COMMAND
        ${CMAKE_COMMAND} -E copy_if_different
            <SOURCE_DIR>/plugins/artwork/artwork.h
            ${EXTLIB_INSTALL_DIR}/include/deadbeef/artwork.h
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 0 LOG_BUILD 0 LOG_INSTALL 1
)

add_dependencies(ext_all ext_deadbeef)
