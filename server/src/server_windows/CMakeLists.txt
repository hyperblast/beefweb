set(
    SERVER_SOURCES
    event_loop.cpp event_loop.hpp
    iocp.cpp iocp.hpp
    server_impl.cpp server_impl.hpp
)

add_library(server OBJECT ${SERVER_SOURCES})
add_dependencies(server ext_all)
