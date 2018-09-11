cmake_minimum_required(VERSION 3.0)

project(zlib C)

set(
    SOURCE_FILES
    src/modp_ascii.c
    src/modp_ascii_data.h
    src/modp_b16.c
    src/modp_b16_data.h
    src/modp_b2.c
    src/modp_b2_data.h
    src/modp_b64.c
    src/modp_b64_data.h
    # src/modp_b64r.c
    # src/modp_b64r_data.h
    # src/modp_b64w.c
    # src/modp_b64w_data.h
    src/modp_b85.c
    src/modp_b85_data.h
    src/modp_bjavascript.c
    src/modp_bjavascript_data.h
    src/modp_burl.c
    src/modp_burl_data.h
    src/modp_html.c
    src/modp_json.c
    src/modp_numtoa.c
    src/modp_qsiter.c
    src/modp_utf8.c
    src/modp_xml.c
)

set(
    HEADER_FILES
    src/extern_c_begin.h
    src/extern_c_end.h
    src/modp_ascii.h
    src/modp_b16.h
    src/modp_b2.h
    src/modp_b64.h
    # src/modp_b64r.h
    # src/modp_b64w.h
    src/modp_b85.h
    src/modp_bjavascript.h
    src/modp_burl.h
    src/modp_html.h
    src/modp_json.h
    src/modp_numtoa.h
    src/modp_qsiter.h
    src/modp_utf8.h
    src/modp_xml.h
)

add_library(modpbase64 STATIC ${SOURCE_FILES} ${HEADER_FILES})

install(TARGETS modpbase64 ARCHIVE DESTINATION lib)
install(FILES ${HEADER_FILES} DESTINATION include)
