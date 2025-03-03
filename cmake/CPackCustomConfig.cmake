if(${CPACK_GENERATOR} STREQUAL "TXZ")
    if(NOT CPACK_DEADBEEF_SINGLE_DIR)
        message(FATAL_ERROR "ENABLE_DEADBEEF_SINGLE_DIR should be ON when building .tar.xz package")
    endif()

    set(CPACK_PACKAGING_INSTALL_PREFIX "/opt/deadbeef")
endif()

if(${CPACK_GENERATOR} STREQUAL "DEB")
    if(CPACK_DEADBEEF_SINGLE_DIR)
        message(FATAL_ERROR "ENABLE_DEADBEEF_SINGLE_DIR should be OFF when building .deb package")
    endif()

    set(CPACK_PACKAGING_INSTALL_PREFIX "/opt/deadbeef")
endif()
