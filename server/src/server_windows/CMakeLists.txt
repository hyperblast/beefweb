set(
    CORE_SERVER_SOURCES
    event_loop.cpp event_loop.hpp
    header_map.cpp header_map.hpp
    http_api.cpp http_api.hpp
    http_server.cpp http_server.hpp
    iocp.cpp iocp.hpp
)

set(
    CORE_LIBRARIES
    "${CORE_LIBRARIES};httpapi.lib"
    PARENT_SCOPE
)

add_library(core_server OBJECT ${CORE_SERVER_SOURCES})
add_dependencies(core_server ext_all)
