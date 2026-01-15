include(CheckCCompilerFlag)
include(CheckCXXCompilerFlag)
include(CMakeDependentOption)

set(ALL_LANG_NAMES C CXX)
set(ALL_TARGET_NAMES EXE SHARED MODULE)
set(ALL_BUILD_TYPES DEBUG RELEASE MINSIZEREL RELWITHDEBINFO)

function(add_compiler_flag FLAG)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${FLAG}" PARENT_SCOPE)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${FLAG}" PARENT_SCOPE)
endfunction()

function(checked_add_compiler_flag FLAG)
    string(MD5 FLAG_HASH "${FLAG}")
    string(TOUPPER ${FLAG_HASH} FLAG_HASH)

    set(SUPPORTS_C_FLAG "SUPPORTS_C_FLAG_${FLAG_HASH}")
    set(SUPPORTS_CXX_FLAG "SUPPORTS_CXX_FLAG_${FLAG_HASH}")

    check_c_compiler_flag(${FLAG} ${SUPPORTS_C_FLAG})
    check_cxx_compiler_flag(${FLAG} ${SUPPORTS_CXX_FLAG})

    if(${SUPPORTS_C_FLAG})
        message(STATUS "Enabling C compiler flag: ${FLAG}")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${FLAG}" PARENT_SCOPE)
    else()
        message(STATUS "Not enabling CXX compiler flag: ${FLAG}")
    endif()

    if(${SUPPORTS_CXX_FLAG})
        message(STATUS "Enabling CXX compiler flag: ${FLAG}")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${FLAG}" PARENT_SCOPE)
    else()
        message(STATUS "Not enabling CXX compiler flag: ${FLAG}")
    endif()
endfunction()

function(add_linker_flag FLAG)
    foreach(TARGET_NAME ${ALL_TARGET_NAMES})
        set(CMAKE_${TARGET_NAME}_LINKER_FLAGS "${CMAKE_${TARGET_NAME}_LINKER_FLAGS} ${FLAG}" PARENT_SCOPE)
    endforeach()
endfunction()

function(checked_add_linker_flag FLAG)
    string(MD5 FLAG_HASH "${FLAG}")
    string(TOUPPER ${FLAG_HASH} FLAG_HASH)

    set(SUPPORTS_FLAG "SUPPORTS_LINKER_FLAG_${FLAG_HASH}")

    check_cxx_compiler_flag(${FLAG} ${SUPPORTS_FLAG})

    if(${SUPPORTS_FLAG})
        message(STATUS "Enabling linker flag: ${FLAG}")

        foreach(TARGET_NAME ${ALL_TARGET_NAMES})
            set(CMAKE_${TARGET_NAME}_LINKER_FLAGS "${CMAKE_${TARGET_NAME}_LINKER_FLAGS} ${FLAG}" PARENT_SCOPE)
        endforeach()
    else()
        message(STATUS "Not enabling linker flag: ${FLAG}")
    endif()
endfunction()

function(local_library NAME)
    set(CMAKE_MODULE_PATH "${EXTLIB_SOURCE_DIR}/${NAME}/local;${CMAKE_MODULE_PATH}" PARENT_SCOPE)
endfunction()

function(local_library_option NAME OPT COND)
    set(DESC "Build with local ${NAME}")

    if(COND)
        cmake_dependent_option(${OPT} "${DESC}" ${ENABLE_LOCAL_LIBS} "${COND}" OFF)
    else()
        option(${OPT} "${DESC}" ${ENABLE_LOCAL_LIBS})
    endif()

    if(${OPT})
        set(MODULE_DIR "${EXTLIB_SOURCE_DIR}/${NAME}/local")
    else()
        set(MODULE_DIR "${EXTLIB_SOURCE_DIR}/${NAME}/system")
    endif()

    if(EXISTS "${MODULE_DIR}")
        set(CMAKE_MODULE_PATH "${MODULE_DIR};${CMAKE_MODULE_PATH}" PARENT_SCOPE)
    endif()
endfunction()

function(option_dependency_check OPT1 OPT2)
    if(${OPT1})
        if(NOT ${OPT2})
            message(SEND_ERROR "Option ${OPT1} requires option ${OPT2}")
        endif()
    endif()
endfunction()

function(print_status)
    get_cmake_property(ALL_VAR_NAMES VARIABLES)
    set(VAR_NAMES "")

    foreach(VAR_NAME ${ALL_VAR_NAMES})
        if(VAR_NAME MATCHES "^(ENABLE|OS|HOST_OS|CXX)_")
            list(APPEND VAR_NAMES ${VAR_NAME})
        endif()
    endforeach()

    list(APPEND VAR_NAMES IS_MULTI_CONFIG)

    if(NOT IS_MULTI_CONFIG)
        list(APPEND VAR_NAMES CMAKE_BUILD_TYPE)
    endif()

    foreach(VAR_NAME ${VAR_NAMES})
        message(STATUS "${VAR_NAME}: ${${VAR_NAME}}")
    endforeach()
endfunction()

function(print_toolchain_flags)
    set(VAR_NAMES "")

    if(IS_MULTI_CONFIG)
        set(BUILD_TYPES ${ALL_BUILD_TYPES})
    else()
        string(TOUPPER ${CMAKE_BUILD_TYPE} BUILD_TYPES)
    endif()

    foreach(LANG_NAME ${ALL_LANG_NAMES})
        list(APPEND VAR_NAMES CMAKE_${LANG_NAME}_FLAGS)
        foreach(BUILD_TYPE ${BUILD_TYPES})
            list(APPEND VAR_NAMES CMAKE_${LANG_NAME}_FLAGS_${BUILD_TYPE})
        endforeach()
    endforeach()

    foreach(TARGET ${ALL_TARGET_NAMES})
        list(APPEND VAR_NAMES CMAKE_${TARGET}_LINKER_FLAGS)
        foreach(BUILD_TYPE ${BUILD_TYPES})
            list(APPEND VAR_NAMES CMAKE_${TARGET}_LINKER_FLAGS_${BUILD_TYPE})
        endforeach()
    endforeach()

    foreach(VAR_NAME ${VAR_NAMES})
        message(STATUS "${VAR_NAME}: ${${VAR_NAME}}")
    endforeach()
endfunction()

macro(set_by_pointer_size VAR VALUE_4 VALUE_8)
    if(${CMAKE_SIZEOF_VOID_P} STREQUAL 4)
        set(${VAR} ${VALUE_4})
    elseif(${CMAKE_SIZEOF_VOID_P} STREQUAL 8)
        set(${VAR} ${VALUE_8})
    else()
        message(SEND_ERROR "Unsupported pointer size: ${CMAKE_SIZEOF_VOID_P}")
    endif()
endmacro()

macro(detect_git_revision VAR)
    execute_process(
        COMMAND git rev-parse --short HEAD
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        OUTPUT_VARIABLE ${VAR}
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
endmacro()
