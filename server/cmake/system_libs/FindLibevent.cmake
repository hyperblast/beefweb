find_path(
    LIBEVENT_INCLUDE_DIRS
    NAMES event2/event.h
    DOC "libevent include directory"
)

find_library(
    LIBEVENT_MAIN_LIBRARIES
    NAMES event
    DOC "libevent main libraries"
)

find_library(
    LIBEVENT_PTHREADS_LIBRARIES
    NAMES event_pthreads
    DOC "libevent_pthreads libraries"
)

include(FindPackageHandleStandardArgs)

if((NOT "${LIBEVENT_LIBRARIES}") AND "${LIBEVENT_MAIN_LIBRARIES}" AND "${LIBEVENT_PTHREADS_LIBRARIES}")
    set(LIBEVENT_LIBRARIES "${LIBEVENT_MAIN_LIBRARIES};${LIBEVENT_PTHREADS_LIBRARIES}")
endif()

find_package_handle_standard_args(
    LIBEVENT
    REQUIRED_VARS
        LIBEVENT_INCLUDE_DIRS LIBEVENT_LIBRARIES LIBEVENT_MAIN_LIBRARIES LIBEVENT_PTHREADS_LIBRARIES
)

mark_as_advanced(
    LIBEVENT_INCLUDE_DIRS LIBEVENT_LIBRARIES LIBEVENT_MAIN_LIBRARIES LIBEVENT_PTHREADS_LIBRARIES
)
