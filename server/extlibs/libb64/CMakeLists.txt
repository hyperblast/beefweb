include(ExternalProject)

ExternalProject_Add(
    ext_libb64
    PREFIX
        ${EXTLIB_PREFIX_DIR}
    URL
        https://sourceforge.net/projects/libb64/files/libb64/libb64/libb64-1.2.src.zip
    URL_HASH
        SHA256=343d8d61c5cbe3d3407394f16a5390c06f8ff907bd8d614c16546310b689bfd3
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/libb64
    PATCH_COMMAND
        ${EXTLIB_PATCHER} libb64
    CMAKE_ARGS
        -DCMAKE_C_FLAGS=${CMAKE_C_FLAGS}
        -DCMAKE_BUILD_TYPE=$<CONFIG>
        -DCMAKE_INSTALL_PREFIX=${EXTLIB_INSTALL_DIR}
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

add_dependencies(ext_all ext_libb64)
