set(Boost_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

set(
    Boost_LIBRARIES
    ${EXTLIB_INSTALL_DIR}/lib/libboost_system.a
    ${EXTLIB_INSTALL_DIR}/lib/libboost_filesystem.a
    ${EXTLIB_INSTALL_DIR}/lib/libboost_thread.a
)
