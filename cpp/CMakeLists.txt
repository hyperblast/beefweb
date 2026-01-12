set(COMMON_C_FLAGS "")

if(OS_POSIX)
    set(COMMON_C_FLAGS "${COMMON_C_FLAGS} -fPIC -pthread -D_FILE_OFFSET_BITS=64")
endif()

if(CXX_MSVC)
    set(COMMON_C_FLAGS "${COMMON_C_FLAGS} /MP /D_DISABLE_CONSTEXPR_MUTEX_CONSTRUCTOR")
endif()

set(CMAKE_C_FLAGS   "${CMAKE_C_FLAGS} ${COMMON_C_FLAGS}")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMMON_C_FLAGS}")

if(CXX_MSVC)
    if(ENABLE_STATIC_STDLIB)
        foreach(LANG_NAME C CXX)
            foreach(BUILD_TYPE DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)
                set(VAR_NAME CMAKE_${LANG_NAME}_FLAGS_${BUILD_TYPE})
                string(REPLACE "/MD" "/MT" ${VAR_NAME} "${${VAR_NAME}}")
            endforeach()
        endforeach()
    endif()

    foreach(TARGET EXE SHARED MODULE)
        set(VAR_NAME CMAKE_${TARGET}_LINKER_FLAGS_RELWITHDEBINFO)
        string(REPLACE "/INCREMENTAL" "/INCREMENTAL:NO" ${VAR_NAME} "${${VAR_NAME}}")
        set(${VAR_NAME} "${${VAR_NAME}} /OPT:REF /OPT:ICF")
    endforeach()
endif()

add_subdirectory(extlibs)
add_subdirectory(server)
