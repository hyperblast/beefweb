find_package(Libevent REQUIRED)
find_package(Libevhtp REQUIRED)

include_directories(
    ${LIBEVENT_INCLUDE_DIRS}
    ${LIBEVHTP_INCLUDE_DIRS}
)

set(
    CORE_SERVER_SOURCES
    evhtp_server.cpp evhtp_server.hpp
    libevent_glue.cpp libevent_glue.hpp
    libevhtp_glue.cpp libevhtp_glue.hpp
)

set(
    CORE_LIBRARIES
    "${CORE_LIBRARIES};${LIBEVHTP_LIBRARIES};${LIBEVENT_PTHREADS_LIBRARIES};${LIBEVENT_LIBRARIES}"
    PARENT_SCOPE
)

add_library(core_server OBJECT ${CORE_SERVER_SOURCES})
add_dependencies(core_server ext_all)
