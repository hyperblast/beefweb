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
            https://dl.bintray.com/boostorg/release/1.67.0/source/boost_1_67_0.tar.bz2
        URL_HASH
            SHA256=2684c972994ee57fc5632e03bf044746f6eb45d4920c343937a465fd67a5adba
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
            https://dl.bintray.com/boostorg/release/1.67.0/source/boost_1_67_0.zip
        URL_HASH
            SHA256=7e37372d8cedd0fd6b7529e9dd67c2cb1c60e6c607aed721f5894d704945a7ec
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
