set(EXTLIB_CACHE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/.cache)
set(EXTLIB_PATCHER ${CMAKE_CURRENT_SOURCE_DIR}/apply-patches.sh)

set(EXTLIB_C_FLAGS   "${CMAKE_C_FLAGS}")
set(EXTLIB_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
    set(EXTLIB_C_FLAGS "${EXTLIB_C_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_C_FLAGS_${BUILD_TYPE}}>")
    set(EXTLIB_CXX_FLAGS "${EXTLIB_CXX_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_CXX_FLAGS_${BUILD_TYPE}}>")
endforeach()

add_subdirectory(boost)
add_subdirectory(libevent)
add_subdirectory(libevhtp)
add_subdirectory(nljson)

if(ENABLE_PLUGIN_DEADBEEF)
    add_subdirectory(deadbeef)
endif()

if(ENABLE_TESTS)
    add_subdirectory(catch)
endif()
