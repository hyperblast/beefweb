include(ExternalProject)

ExternalProject_Add(
    ext_foosdk
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/hyperblast/foosdk/archive/9bf6c6c06f3e7b74b9a1b1c8ec9156be29e4dbaa.zip
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/foosdk
    PATCH_COMMAND
        ${EXTLIB_PATCHER} foosdk
    CMAKE_ARGS
        ${EXTLIB_CMAKE_ARGS}
        -DFOO_PPUI=OFF
        -DFOO_SDK_HELPERS=OFF
        -DFOO_STATIC_STDLIB=OFF
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

add_dependencies(ext_all ext_foosdk)
