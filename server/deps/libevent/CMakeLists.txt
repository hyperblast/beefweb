include(ExternalProject)

ExternalProject_Add(
    libevent
    PREFIX
        ${DEPS_INSTALL_DIR}
    URL
        https://github.com/libevent/libevent/releases/download/release-2.0.22-stable/libevent-2.0.22-stable.tar.gz
    URL_HASH
        SHA256=71c2c49f0adadacfdbe6332a372c38cf9c8b7895bb73dabeaa53cdcc1d4e1fa3
    DOWNLOAD_DIR
        ${DEPS_CACHE_DIR}/libevent
    CONFIGURE_COMMAND
        <SOURCE_DIR>/configure
        "CFLAGS=${DEPS_C_FLAGS}"
        --prefix=<INSTALL_DIR>
        --enable-static
        --disable-shared
        --disable-openssl
        --disable-debug-mode
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

add_dependencies(deps libevent)
