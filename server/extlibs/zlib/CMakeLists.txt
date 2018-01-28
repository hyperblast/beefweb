include(ExternalProject)

if(NOT WIN32)
    message(SEND_ERROR "Building zlib requires Windows target, use system provided zlib with other OSes" )
endif()

ExternalProject_Add(
    ext_zlib
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        http://prdownloads.sourceforge.net/libpng/zlib-1.2.11.tar.gz
    URL_HASH
        SHA256=c3e5e9fdd5004dcb542feda5ee4f0ff0744628baf8ed2dd5d66f8ca1197cb1a1
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/zlib
    PATCH_COMMAND
        ${EXTLIB_PATCHER} zlib
    CMAKE_ARGS
        -DCMAKE_C_FLAGS=${CMAKE_C_FLAGS}
        -DCMAKE_BUILD_TYPE=$<CONFIG>
        -DCMAKE_INSTALL_PREFIX=<INSTALL_DIR>
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

add_dependencies(ext_all ext_zlib)
