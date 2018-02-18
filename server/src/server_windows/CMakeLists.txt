set(
    SERVER_SOURCES
    event_loop.cpp event_loop.hpp
    header_map.cpp header_map.hpp
    http_api.cpp http_api.hpp
    http_server.cpp http_server.hpp
    iocp.cpp iocp.hpp
)

set(
    SERVER_LIBRARIES
    "httpapi.lib"
    PARENT_SCOPE
)

add_library(server OBJECT ${SERVER_SOURCES})
add_dependencies(server ext_all)
