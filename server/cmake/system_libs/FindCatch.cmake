find_path(
    CATCH_INCLUDE_DIRS
    NAMES catch.hpp
    DOC "catch include directory"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    CATCH REQUIRED_VARS CATCH_INCLUDE_DIRS
)

mark_as_advanced(CATCH_INCLUDE_DIRS)
