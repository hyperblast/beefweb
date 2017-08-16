find_path(
    LIBEVHTP_INCLUDE_DIRS
    NAMES evhtp.h
    PATH_SUFFIXES evhtp
    DOC "libevhtp include directory"
)

find_library(
    LIBEVHTP_LIBRARIES
    NAMES evhtp
    DOC "libevhtp libraries"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    LIBEVHTP REQUIRED_VARS LIBEVHTP_INCLUDE_DIRS LIBEVHTP_LIBRARIES
)

mark_as_advanced(LIBEVHTP_INCLUDE_DIRS LIBEVHTP_LIBRARIES)
