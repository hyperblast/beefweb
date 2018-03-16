include(ExternalProject)

ExternalProject_Add(
    ext_foosdk
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/hyperblast/foosdk/archive/2bd812bc24b1288f11016e1aaa578d4bd4d9bc60.zip
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/foosdk
    PATCH_COMMAND
        ${EXTLIB_PATCHER} foosdk
    CMAKE_ARGS
        ${EXTLIB_CMAKE_ARGS}
        -DFOO_SDK_HELPERS=OFF
        -DFOO_ATL_HELPERS=OFF
        -DFOO_STATIC_RUNTIME=OFF
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

add_dependencies(ext_all ext_foosdk)
