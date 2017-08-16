include(ExternalProject)

set(BOOST_LINK      "static")
set(BOOST_THREADING "multi")
set(BOOST_VARIANT   "$<$<CONFIG:Debug>:debug>$<$<NOT:$<CONFIG:Debug>>:release>")

ExternalProject_Add(
    boost
    PREFIX
        ${DEPS_INSTALL_DIR}
    URL
        https://sourceforge.net/projects/boost/files/boost/1.64.0/boost_1_64_0.tar.bz2
    URL_HASH
        SHA256=7bcc5caace97baa948931d712ea5f37038dbb1c5d89b43ad4def4ed7cb683332
    DOWNLOAD_DIR
        ${DEPS_CACHE_DIR}/boost
    PATCH_COMMAND
        ${DEPS_PATCHER} boost
    CONFIGURE_COMMAND
        <SOURCE_DIR>/bootstrap.sh
        --prefix=<INSTALL_DIR>
        --with-libraries=system,filesystem,thread
    BUILD_COMMAND
        <SOURCE_DIR>/b2
        "cflags=${CMAKE_C_FLAGS}"
        "cxxflags=${CMAKE_CXX_FLAGS}"
        "link=${BOOST_LINK}"
        "threading=${BOOST_THREADING}"
        "variant=${BOOST_VARIANT}"
    BUILD_IN_SOURCE 1
    INSTALL_COMMAND
        <SOURCE_DIR>/b2
        "link=${BOOST_LINK}"
        "threading=${BOOST_THREADING}"
        "variant=${BOOST_VARIANT}"
        install
    LOG_DOWNLOAD 1 LOG_UPDATE 0 LOG_CONFIGURE 1 LOG_BUILD 1 LOG_INSTALL 1
)

