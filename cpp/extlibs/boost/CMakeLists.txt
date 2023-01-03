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

    if(ENABLE_STATIC_STDLIB)
        set(BOOST_RUNTIME_LINK "static")
    else()
        set(BOOST_RUNTIME_LINK "shared")
    endif()
else()
    message(SEND_ERROR "Unknown compiler, unable to provide boost toolset" )
endif()

set(
    B2_COMMON_ARGS
    --with-system
    --with-filesystem
    --with-thread
    "link=${BOOST_LINK}"
    "threading=${BOOST_THREADING}"
    "variant=${BOOST_VARIANT}"
)

if(CXX_MSVC)
    set(
        B2_COMMON_ARGS
        ${B2_COMMON_ARGS}
        "address-model=${BOOST_ADDRESS_MODEL}"
        "runtime-link=${BOOST_RUNTIME_LINK}"
    )
endif()

set(
    B2_BUILD_ARGS
    ${B2_COMMON_ARGS}
    "cflags=${CMAKE_C_FLAGS}"
    "cxxflags=${CMAKE_CXX_FLAGS}"
)

set(
    B2_INSTALL_ARGS
    ${B2_COMMON_ARGS}
    --prefix=<INSTALL_DIR>
    install
)

if(OS_POSIX)
    ExternalProject_Add(
        ext_boost
        PREFIX
            ${EXTLIB_INSTALL_DIR}
        URL
            https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.bz2
        URL_HASH
            SHA256=f0397ba6e982c4450f27bf32a2a83292aba035b827a5623a14636ea583318c41
        DOWNLOAD_DIR
            ${EXTLIB_CACHE_DIR}/boost
        BUILD_IN_SOURCE 1
        PATCH_COMMAND
            ${EXTLIB_PATCHER} boost
        CONFIGURE_COMMAND
            <SOURCE_DIR>/bootstrap.sh --with-toolset=${BOOST_TOOLSET}
        BUILD_COMMAND
            <SOURCE_DIR>/b2 ${B2_BUILD_ARGS}
        INSTALL_COMMAND
            <SOURCE_DIR>/b2 ${B2_INSTALL_ARGS}
        LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
    )
endif()

if(OS_WINDOWS)
    ExternalProject_Add(
        ext_boost
        PREFIX
            ${EXTLIB_INSTALL_DIR}
        URL
            https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.zip
        URL_HASH
            SHA256=0fd43bb53580ca54afc7221683dfe8c6e3855b351cd6dce53b1a24a7d7fbeedd
        DOWNLOAD_DIR
            ${EXTLIB_CACHE_DIR}/boost
        BUILD_IN_SOURCE 1
        PATCH_COMMAND
            ${EXTLIB_PATCHER} boost
        CONFIGURE_COMMAND
            <SOURCE_DIR>/bootstrap.bat
        BUILD_COMMAND
            <SOURCE_DIR>/b2.exe ${B2_BUILD_ARGS}
        INSTALL_COMMAND
            <SOURCE_DIR>/install.cmd ${EXTLIB_INSTALL_DIR}
        LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
    )
endif()

add_dependencies(ext_all ext_boost)
