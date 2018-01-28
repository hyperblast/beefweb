set(Boost_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

if(MSVC)
    # Use autolinking with MSVC
    set(Boost_LIBRARIES "")
else()
    set(
        Boost_LIBRARIES
        ${EXTLIB_INSTALL_DIR}/lib/libboost_system.a
        ${EXTLIB_INSTALL_DIR}/lib/libboost_filesystem.a
        ${EXTLIB_INSTALL_DIR}/lib/libboost_thread.a
    )
endif()
