include(ExternalProject)

set(
    CMAKE_ARGS
    ${EXTLIB_CMAKE_ARGS}
    -DFOO_SDK_HELPERS=OFF
)

if(OS_WINDOWS)
    set(
        CMAKE_ARGS
        ${CMAKE_ARGS}
        -DFOO_PPUI=OFF
    )
endif()

ExternalProject_Add(
    ext_foosdk
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/hyperblast/foosdk/archive/6b685e48e142dbcee929e35c7b79d8288685f92f.zip
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/foosdk
    PATCH_COMMAND
        ${EXTLIB_PATCHER} foosdk
    CMAKE_ARGS
        ${CMAKE_ARGS}
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

extlib_target(ext_foosdk)
