include(ExternalProject)

set(DEPENDS "")

if(ENABLE_LOCAL_LIBEVENT)
    set(DEPENDS "ext_libevent")
endif()

ExternalProject_Add(
    ext_libevhtp
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    DEPENDS
        ${DEPENDS}
    URL
        https://github.com/criticalstack/libevhtp/archive/1.2.11n.tar.gz
    URL_HASH
        SHA256=ae114300659267c7e5f9805ba15f7e3f3461613371f38e3f84520a1703146afd
    DOWNLOAD_NAME
        libevhtp-1.2.11n.tar.gz
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/libevhtp
    PATCH_COMMAND
        ${EXTLIB_PATCHER} libevhtp
    CMAKE_ARGS
        -DCMAKE_C_FLAGS=${CMAKE_C_FLAGS}
        -DCMAKE_BUILD_TYPE=$<CONFIG>
        -DCMAKE_PREFIX_PATH=<INSTALL_DIR>
        -DCMAKE_INSTALL_PREFIX=<INSTALL_DIR>
        -DEVHTP_DISABLE_SSL=ON
        -DEVHTP_DISABLE_EVTHR=ON
        -DEVHTP_DISABLE_REGEX=ON
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

add_dependencies(ext_all ext_libevhtp)
