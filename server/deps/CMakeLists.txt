set(DEPS_TARGETS "")
set(DEPS_CACHE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/_cache)
set(DEPS_PATCHER ${CMAKE_CURRENT_SOURCE_DIR}/apply-patches.sh)

set(DEPS_C_FLAGS   "${CMAKE_C_FLAGS}")
set(DEPS_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
    set(DEPS_C_FLAGS   "${DEPS_C_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_C_FLAGS_${BUILD_TYPE}}>")
    set(DEPS_CXX_FLAGS "${DEPS_CXX_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_CXX_FLAGS_${BUILD_TYPE}}>")
endforeach()

add_subdirectory(boost)
set(DEPS_TARGETS ${DEPS_TARGETS} boost)

add_subdirectory(deadbeef)
set(DEPS_TARGETS ${DEPS_TARGETS} deadbeef)

add_subdirectory(libevent)
set(DEPS_TARGETS ${DEPS_TARGETS} libevent)

add_subdirectory(libevhtp)
set(DEPS_TARGETS ${DEPS_TARGETS} libevhtp)

add_subdirectory(nljson)
set(DEPS_TARGETS ${DEPS_TARGETS} nljson)

if(ENABLE_TESTS)
    add_subdirectory(catch)
    set(DEPS_TARGETS ${DEPS_TARGETS} catch)
endif()

set(DEPS_TARGETS "${DEPS_TARGETS}" PARENT_SCOPE)
