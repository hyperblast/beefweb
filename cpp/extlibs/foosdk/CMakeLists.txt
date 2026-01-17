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
        https://github.com/hyperblast/foosdk/archive/ad15a3d851c07fff15ce818d2db6dc60c5acbde2.zip
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/foosdk
    PATCH_COMMAND
        ${EXTLIB_PATCHER} foosdk
    CMAKE_ARGS
        ${CMAKE_ARGS}
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

extlib_target(ext_foosdk)
