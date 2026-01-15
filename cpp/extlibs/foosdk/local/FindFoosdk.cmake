set(FOOSDK_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

set(
    FOOSDK_LIBRARIES
    ${EXTLIB_INSTALL_DIR}/lib/foosdk.lib
)

if(OS_WINDOWS)
    set_by_pointer_size(
        FOOSDK_SHARED_LIB
        shared-Win32.lib
        shared-x64.lib
    )

    list(APPEND FOOSDK_LIBRARIES ${EXTLIB_INSTALL_DIR}/lib/FOOSDK_SHARED_LIB)
endif()
