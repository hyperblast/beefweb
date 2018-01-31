include(Utils)

set(EXTLIB_CACHE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/.cache)
set(EXTLIB_PATCHER ${CMAKE_CURRENT_SOURCE_DIR}/apply-patches${SCRIPT_SUFFIX})

set(EXTLIB_C_FLAGS   "${CMAKE_C_FLAGS}")
set(EXTLIB_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
    set(EXTLIB_C_FLAGS "${EXTLIB_C_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_C_FLAGS_${BUILD_TYPE}}>")
    set(EXTLIB_CXX_FLAGS "${EXTLIB_CXX_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_CXX_FLAGS_${BUILD_TYPE}}>")
endforeach()

option_dependency_check(ENABLE_STATIC_STDLIB ENABLE_LOCAL_BOOST)
option_dependency_check(ENABLE_LOCAL_LIBEVENT ENABLE_LOCAL_LIBEVHTP)

if(ENABLE_LOCAL_BOOST)
    add_subdirectory(boost)
endif()

if(ENABLE_LOCAL_LIBB64)
    add_subdirectory(libb64)
endif()

if(ENABLE_LOCAL_LIBEVENT)
    add_subdirectory(libevent)
endif()

if(ENABLE_LOCAL_LIBEVHTP)
    add_subdirectory(libevhtp)
endif()

if(ENABLE_LOCAL_NLJSON)
    add_subdirectory(nljson)
endif()

if(ENABLE_LOCAL_DEADBEEF)
    add_subdirectory(deadbeef)
endif()

if(ENABLE_LOCAL_CATCH)
    add_subdirectory(catch)
endif()

if(ENABLE_LOCAL_ZLIB)
    add_subdirectory(zlib)
endif()
