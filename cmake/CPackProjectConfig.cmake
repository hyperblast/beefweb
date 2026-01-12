cmake_minimum_required(VERSION 3.12)

set(ARCHIVE_GENERATORS "7Z;TBZ2;TGZ;TXZ;TZ;TZST;ZIP")

if(${CPACK_GENERATOR} IN_LIST ARCHIVE_GENERATORS)
    if(NOT CPACK_DEADBEEF_INSTALL_INTO_ROOT)
        message(FATAL_ERROR "DEADBEEF_INSTALL_INTO_ROOT should be ON when building archive package")
    endif()
endif()

if(${CPACK_GENERATOR} STREQUAL "DEB")
    if(CPACK_DEADBEEF_INSTALL_INTO_ROOT)
        message(FATAL_ERROR "DEADBEEF_INSTALL_INTO_ROOT should be OFF when building .deb package")
    endif()

    set(CPACK_PACKAGING_INSTALL_PREFIX "/opt/deadbeef")
endif()
