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
        https://github.com/hyperblast/foosdk/archive/fe545315f6b418615cf3905b4144274989e732c7.zip
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/foosdk
    PATCH_COMMAND
        ${EXTLIB_PATCHER} foosdk
    CMAKE_ARGS
        ${CMAKE_ARGS}
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

extlib_target(ext_foosdk)
