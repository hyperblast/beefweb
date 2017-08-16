set(Boost_INCLUDE_DIRS ${DEPS_INSTALL_DIR}/include)

set(
    Boost_LIBRARIES
    ${DEPS_INSTALL_DIR}/lib/libboost_system.a
    ${DEPS_INSTALL_DIR}/lib/libboost_filesystem.a
    ${DEPS_INSTALL_DIR}/lib/libboost_thread.a
)
