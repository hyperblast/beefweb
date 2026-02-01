find_path(
    CATCH_INCLUDE_DIRS
    NAMES catch2/catch.hpp
    DOC "catch2 include directory"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    CATCH REQUIRED_VARS CATCH_INCLUDE_DIRS
)

mark_as_advanced(CATCH_INCLUDE_DIRS)
