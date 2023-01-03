cmake_minimum_required(VERSION 3.0)

project(zlib C)

set(
    SOURCE_FILES
    adler32.c
    compress.c
    crc32.c crc32.h
    deflate.c deflate.h
    gzclose.c gzguts.h
    gzlib.c
    gzread.c
    gzwrite.c
    infback.c
    inffast.c inffast.h
    inffixed.h
    inflate.c inflate.h
    inftrees.c inftrees.h
    trees.c trees.h
    uncompr.c
    zutil.c zutil.h
)

set(
    HEADER_FILES
    zconf.h
    zlib.h
)

add_definitions(-D_CRT_SECURE_NO_DEPRECATE -D_CRT_NONSTDC_NO_DEPRECATE)
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

add_library(zlib STATIC ${SOURCE_FILES} ${HEADER_FILES})

if(NOT MSVC)
    set_target_properties(zlib PROPERTIES OUTPUT_NAME z)
endif()

install(TARGETS zlib ARCHIVE DESTINATION lib)
install(FILES ${HEADER_FILES} DESTINATION include)
