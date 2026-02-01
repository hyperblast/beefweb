find_path(
    NLJSON_INCLUDE_DIRS
    NAMES nlohmann/json.hpp
    DOC "nlohmann json include directory"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    Nljson REQUIRED_VARS NLJSON_INCLUDE_DIRS
)

mark_as_advanced(NLJSON_INCLUDE_DIRS)
