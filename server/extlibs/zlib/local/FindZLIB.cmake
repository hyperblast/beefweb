set(ZLIB_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

if(MSVC)
    set(ZLIB_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/zlib.lib)
    set(ZLIB_DLL_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/zlib_dll.lib)
else()
    set(ZLIB_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/libz.a)
endif()
