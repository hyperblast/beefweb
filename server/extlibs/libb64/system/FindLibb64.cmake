find_path(
    LIBB64_INCLUDE_DIRS
    NAMES b64/cdecode.h
    DOC "libb64 include directory"
)

find_library(
    LIBB64_LIBRARIES
    NAMES b64
    DOC "libb64 libraries"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    LIBB64 REQUIRED_VARS LIBB64_INCLUDE_DIRS LIBB64_LIBRARIES
)

mark_as_advanced(LIBB64_INCLUDE_DIRS LIBB64_LIBRARIES)
