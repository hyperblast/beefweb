set(CMAKE_FOLDER cpp_libs)
set(EXTLIB_CACHE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/.cache)
set(EXTLIB_PATCHER ${CMAKE_CURRENT_SOURCE_DIR}/apply_patches${SCRIPT_SUFFIX})

set(
    EXTLIB_CMAKE_ARGS
    -DCMAKE_BUILD_TYPE=$<CONFIG>
    -DCMAKE_PREFIX_PATH=${EXTLIB_INSTALL_DIR}
    -DCMAKE_INSTALL_PREFIX=${EXTLIB_INSTALL_DIR}
    "-DCMAKE_C_FLAGS=${CMAKE_C_FLAGS}"
    "-DCMAKE_CXX_FLAGS=${CMAKE_CXX_FLAGS}"
)

set(EXTLIB_C_FLAGS   "${CMAKE_C_FLAGS}")
set(EXTLIB_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
    set(
        EXTLIB_CMAKE_ARGS
        ${EXTLIB_CMAKE_ARGS}
        "-DCMAKE_C_FLAGS_${BUILD_TYPE}=${CMAKE_C_FLAGS_${BUILD_TYPE}}"
        "-DCMAKE_CXX_FLAGS_${BUILD_TYPE}=${CMAKE_CXX_FLAGS_${BUILD_TYPE}}"
    )

    set(
        EXTLIB_C_FLAGS
        "${EXTLIB_C_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_C_FLAGS_${BUILD_TYPE}}>"
    )

    set(
        EXTLIB_CXX_FLAGS
        "${EXTLIB_CXX_FLAGS} $<$<CONFIG:${BUILD_TYPE}>:${CMAKE_CXX_FLAGS_${BUILD_TYPE}}>"
    )
endforeach()

option_dependency_check(ENABLE_STATIC_STDLIB ENABLE_LOCAL_BOOST)

function(extlib_target TARGET_NAME)
    set_property(TARGET ${TARGET_NAME} PROPERTY FOLDER cpp_libs)
    add_dependencies(ext_all ${TARGET_NAME})
endfunction()

add_custom_target(ext_all)

if(ENABLE_LOCAL_BOOST)
    add_subdirectory(boost)
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

if(ENABLE_LOCAL_STRINGENCODERS)
    add_subdirectory(stringencoders)
endif()

if(ENABLE_LOCAL_ZLIB)
    add_subdirectory(zlib)
endif()

if(ENABLE_FOOBAR2000)
    add_subdirectory(foosdk)
endif()
