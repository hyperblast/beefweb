find_path(
    STRINGENCODERS_INCLUDE_DIRS
    NAMES modp_b64.h
    DOC "stringencoders include directory"
)

find_library(
    STRINGENCODERS_LIBRARIES
    NAMES modpbase64
    DOC "stringencoders libraries"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    StringEncoders REQUIRED_VARS STRINGENCODERS_INCLUDE_DIRS STRINGENCODERS_LIBRARIES
)

mark_as_advanced(STRINGENCODERS_INCLUDE_DIRS STRINGENCODERS_LIBRARIES)
