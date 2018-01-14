cmake_minimum_required(VERSION 3.0)

project(libb64 C)

set(
    SOURCE_FILES
    src/cdecode.c
    src/cencode.c
)

set(
    HEADER_FILES
    include/b64/cdecode.h
    include/b64/cencode.h
)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

add_library(b64 STATIC ${SOURCE_FILES} ${HEADER_FILES})

install(TARGETS b64 ARCHIVE DESTINATION lib)
install(FILES ${HEADER_FILES} DESTINATION include/b64)
