include(ExternalProject)

if(NOT OS_WINDOWS)
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
        ${EXTLIB_CMAKE_ARGS}
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

if(CXX_MSVC)
    if(${CMAKE_SIZEOF_VOID_P} STREQUAL 4)
        set(LIB_MACHINE "x86")
    elseif(${CMAKE_SIZEOF_VOID_P} STREQUAL 8)
        set(LIB_MACHINE "x64")
    else()
        message(SEND_ERROR "Unknown pointer size, unable to provide /machine option for lib.exe" )
    endif()

    ExternalProject_Add_Step(
        ext_zlib make_import_lib
        COMMAND
            ${CMAKE_CURRENT_SOURCE_DIR}/make-import-lib.cmd ${LIB_MACHINE} <SOURCE_DIR> <INSTALL_DIR>
        COMMENT
            "Creating import library for zlib1.dll"
        DEPENDEES
            install
        LOG 1
    )
endif()

add_dependencies(ext_all ext_zlib)
