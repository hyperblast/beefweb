set(Boost_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

if(MSVC)
    set(
        Boost_LIBRARIES
        ${EXTLIB_INSTALL_DIR}/lib/libboost_system.lib
        ${EXTLIB_INSTALL_DIR}/lib/libboost_filesystem.lib
        ${EXTLIB_INSTALL_DIR}/lib/libboost_thread.lib
    )
else()
    set(
        Boost_LIBRARIES
        ${EXTLIB_INSTALL_DIR}/lib/libboost_system.a
        ${EXTLIB_INSTALL_DIR}/lib/libboost_filesystem.a
        ${EXTLIB_INSTALL_DIR}/lib/libboost_thread.a
    )
endif()
