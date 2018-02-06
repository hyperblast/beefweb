set(
    SERVER_SOURCES
    event_loop.cpp event_loop.hpp
    http_server.cpp http_server.hpp
    iocp.cpp iocp.hpp
    server_impl.cpp server_impl.hpp
)

add_library(server OBJECT ${SERVER_SOURCES})

set_target_properties(
    server PROPERTIES
    INTERFACE_LINK_LIBRARIES
    "httpapi.lib"
) 

add_dependencies(server ext_all)
