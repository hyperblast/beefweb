include(ExternalProject)

ExternalProject_Add(
    ext_stringencoders
    PREFIX
        ${EXTLIB_INSTALL_DIR}
    URL
        https://github.com/client9/stringencoders/archive/e1448a9415f4ebf6f559c86718193ba067cbb99d.zip
    URL_HASH
        SHA256=96b4083d73a4d769ceabd7d40dbf54b03ad897d8159ec5569ed5ad9e78798c54
    DOWNLOAD_DIR
        ${EXTLIB_CACHE_DIR}/stringencoders
    PATCH_COMMAND
        ${EXTLIB_PATCHER} stringencoders
    CMAKE_ARGS
        ${EXTLIB_CMAKE_ARGS}
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

extlib_target(ext_stringencoders)
