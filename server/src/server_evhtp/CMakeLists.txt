find_package(Libevent REQUIRED)
find_package(Libevhtp REQUIRED)

include_directories(
    ${LIBEVENT_INCLUDE_DIRS}
    ${LIBEVHTP_INCLUDE_DIRS}
)

set(
    SERVER_SOURCES
    evhtp_server.cpp evhtp_server.hpp
    libevent_glue.cpp libevent_glue.hpp
    libevhtp_glue.cpp libevhtp_glue.hpp
)

set(
    SERVER_LIBRARIES
    "${LIBEVHTP_LIBRARIES};${LIBEVENT_PTHREADS_LIBRARIES};${LIBEVENT_LIBRARIES}"
    PARENT_SCOPE
)

add_library(server OBJECT ${SERVER_SOURCES})
add_dependencies(server ext_all)
