find_path(
    LIBEVENT_INCLUDE_DIRS
    NAMES event2/event.h
    DOC "libevent include directory"
)

find_library(
    LIBEVENT_LIBRARIES
    NAMES event
    DOC "libevent libraries"
)

find_library(
    LIBEVENT_PTHREADS_LIBRARIES
    NAMES event_pthreads
    DOC "libevent_pthreads libraries"
)

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    LIBEVENT
    REQUIRED_VARS
        LIBEVENT_INCLUDE_DIRS
        LIBEVENT_LIBRARIES
        LIBEVENT_PTHREADS_LIBRARIES
)

mark_as_advanced(
    LIBEVENT_INCLUDE_DIRS
    LIBEVENT_LIBRARIES
    LIBEVENT_PTHREADS_LIBRARIES
)
