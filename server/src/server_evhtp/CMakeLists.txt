find_package(Libevent REQUIRED)
find_package(Libevhtp REQUIRED)

include_directories(
    ${LIBEVENT_INCLUDE_DIRS}
    ${LIBEVHTP_INCLUDE_DIRS}
)

set(
    SERVER_SOURCES
    libevent.cpp libevent.hpp
    libevhtp.cpp libevhtp.hpp
    server_evhtp.cpp server_evhtp.hpp
)

add_library(server OBJECT ${SERVER_SOURCES})

set_target_properties(
    server PROPERTIES
    INTERFACE_LINK_LIBRARIES "${LIBEVHTP_LIBRARIES};${LIBEVENT_LIBRARIES}"
)

add_dependencies(core deps)
