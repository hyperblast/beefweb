set(ZLIB_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

if(MSVC)
    set(ZLIB_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/zlib.lib)
else()
    set(ZLIB_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/libz.a)
endif()
