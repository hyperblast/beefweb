set(DEPS_CACHE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/_cache)
set(DEPS_PATCHER ${CMAKE_CURRENT_SOURCE_DIR}/apply-patches.sh)

set(DEPS_C_FLAGS   "${CMAKE_C_FLAGS}")
set(DEPS_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
    set(DEPS_C_FLAGS   "${DEPS_C_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_C_FLAGS_${BUILD_TYPE}}>")
    set(DEPS_CXX_FLAGS "${DEPS_CXX_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_CXX_FLAGS_${BUILD_TYPE}}>")
endforeach()

add_subdirectory(boost)
add_subdirectory(deadbeef)
add_subdirectory(libevent)
add_subdirectory(libevhtp)
add_subdirectory(nljson)

if(ENABLE_TESTS)
    add_subdirectory(catch)
endif()
