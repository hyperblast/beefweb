find_path(
    DEADBEEF_INCLUDE_DIRS
    NAMES deadbeef/deadbeef.h
    PATHS /opt/deadbeef/include
    DOC "deadbeef include directory"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    DEADBEEF REQUIRED_VARS DEADBEEF_INCLUDE_DIRS
)

mark_as_advanced(DEADBEEF_INCLUDE_DIRS)
