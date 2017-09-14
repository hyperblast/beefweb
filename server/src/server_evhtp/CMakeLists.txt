find_package(Libevent REQUIRED)
find_package(Libevhtp REQUIRED)

include_directories(
    ${LIBEVENT_INCLUDE_DIRS}
    ${LIBEVHTP_INCLUDE_DIRS}
)

set(
    SERVER_SOURCES
    libevent_glue.cpp libevent_glue.hpp
    libevhtp_glue.cpp libevhtp_glue.hpp
    server_impl.cpp server_impl.hpp
)

add_library(server OBJECT ${SERVER_SOURCES})

set_target_properties(
    server PROPERTIES
    INTERFACE_LINK_LIBRARIES "${LIBEVHTP_LIBRARIES};${LIBEVENT_LIBRARIES}"
)

add_dependencies(server deps)
