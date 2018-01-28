set(
    SERVER_SOURCES
    server_impl.cpp server_impl.hpp
)

add_library(server OBJECT ${SERVER_SOURCES})
add_dependencies(server ext_all)
