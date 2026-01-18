set(FOOSDK_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

if(OS_WINDOWS)
    set(FOOSDK_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/foosdk.lib)

    set_by_pointer_size(
        FOOSDK_SHARED_LIB
        shared-Win32.lib
        shared-x64.lib
    )

    list(APPEND FOOSDK_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/${FOOSDK_SHARED_LIB})
endif()

if(OS_MAC)
    set(FOOSDK_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/libfoosdk.a)
endif()
