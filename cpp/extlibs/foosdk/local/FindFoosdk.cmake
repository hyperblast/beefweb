set(FOOSDK_INCLUDE_DIRS ${EXTLIB_INSTALL_DIR}/include)

if(${CMAKE_SIZEOF_VOID_P} STREQUAL 4)
    set(FOOSDK_ARCH_SUFFIX "Win32")
elseif(${CMAKE_SIZEOF_VOID_P} STREQUAL 8)
    set(FOOSDK_ARCH_SUFFIX "x64")
else()
    message(SEND_ERROR "Unknown pointer size")
endif()

set(
    FOOSDK_LIBRARIES
    ${EXTLIB_INSTALL_DIR}/lib/foosdk.lib
    ${EXTLIB_INSTALL_DIR}/lib/shared-${FOOSDK_ARCH_SUFFIX}.lib
)
