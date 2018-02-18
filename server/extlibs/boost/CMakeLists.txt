include(ExternalProject)

set(BOOST_LINK      "static")
set(BOOST_THREADING "multi")
set(BOOST_VARIANT   "$<$<CONFIG:Debug>:debug>$<$<NOT:$<CONFIG:Debug>>:release>")

if(CXX_GCC)
    set(BOOST_TOOLSET "gcc")
elseif(CXX_CLANG)
    set(BOOST_TOOLSET "clang")
elseif(CXX_MSVC)
    set(BOOST_TOOLSET "msvc")
    if(${CMAKE_SIZEOF_VOID_P} STREQUAL 4)
        set(BOOST_ADDRESS_MODEL "32")
    elseif(${CMAKE_SIZEOF_VOID_P} STREQUAL 8)
        set(BOOST_ADDRESS_MODEL "64")
    else()
        message(SEND_ERROR "Unknown pointer size, unable to provide boost address model" )
    endif()
else()
    message(SEND_ERROR "Unknown compiler, unable to provide boost toolset" )
endif()

if(OS_POSIX)
    ExternalProject_Add(
        ext_boost
        PREFIX
            ${EXTLIB_PREFIX_DIR}
        URL
            https://sourceforge.net/projects/boost/files/boost/1.64.0/boost_1_64_0.tar.bz2
        URL_HASH
            SHA256=7bcc5caace97baa948931d712ea5f37038dbb1c5d89b43ad4def4ed7cb683332
        DOWNLOAD_DIR
            ${EXTLIB_CACHE_DIR}/boost
        PATCH_COMMAND
            ${EXTLIB_PATCHER} boost
        CONFIGURE_COMMAND
            ${CMAKE_COMMAND} -E copy_directory <SOURCE_DIR> <BINARY_DIR>${CONFIG_SUFFIX}
        COMMAND
            <BINARY_DIR>${CONFIG_SUFFIX}/bootstrap.sh
            --prefix=${EXTLIB_INSTALL_DIR}
            --with-toolset=${BOOST_TOOLSET}
            --with-libraries=system,filesystem,thread
        BUILD_COMMAND
            <BINARY_DIR>${CONFIG_SUFFIX}/b2
            "cflags=${CMAKE_C_FLAGS}"
            "cxxflags=${CMAKE_CXX_FLAGS}"
            "link=${BOOST_LINK}"
            "threading=${BOOST_THREADING}"
            "variant=${BOOST_VARIANT}"
        INSTALL_COMMAND
            <BINARY_DIR>${CONFIG_SUFFIX}/b2
            "link=${BOOST_LINK}"
            "threading=${BOOST_THREADING}"
            "variant=${BOOST_VARIANT}"
            install
        LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
    )
endif()

if(OS_WINDOWS)
    ExternalProject_Add(
        ext_boost
        PREFIX
            ${EXTLIB_PREFIX_DIR}
        URL
            https://sourceforge.net/projects/boost/files/boost/1.64.0/boost_1_64_0.zip
        URL_HASH
            SHA256=b99973c805f38b549dbeaf88701c0abeff8b0e8eaa4066df47cac10a32097523
        DOWNLOAD_DIR
            ${EXTLIB_CACHE_DIR}/boost
        PATCH_COMMAND
            ${EXTLIB_PATCHER} boost
        CONFIGURE_COMMAND
            ${CMAKE_COMMAND} -E copy_directory <SOURCE_DIR> <BINARY_DIR>${CONFIG_SUFFIX}
        COMMAND
            <BINARY_DIR>${CONFIG_SUFFIX}/run.cmd bootstrap.bat
        BUILD_COMMAND
            <BINARY_DIR>${CONFIG_SUFFIX}/run.cmd b2.exe
            "cflags=${CMAKE_C_FLAGS}"
            "cxxflags=${CMAKE_CXX_FLAGS}"
            "link=${BOOST_LINK}"
            "threading=${BOOST_THREADING}"
            "variant=${BOOST_VARIANT}"
            "address-model=${BOOST_ADDRESS_MODEL}"
            --with-system
            --with-filesystem
            --with-thread
        INSTALL_COMMAND
            <BINARY_DIR>${CONFIG_SUFFIX}/run.cmd install.cmd ${EXTLIB_INSTALL_DIR}
        LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
    )
endif()

add_dependencies(ext_all ext_boost)
