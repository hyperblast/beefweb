include(CheckCXXCompilerFlag)
include(CMakeDependentOption)

function(add_cxx_compiler_flag FLAG)
    string(MD5 CHECK_VAR "${FLAG}")
    string(SUBSTRING ${CHECK_VAR} 0 16 CHECK_VAR)
    string(TOUPPER ${CHECK_VAR} CHECK_VAR)
    set(CHECK_VAR "ADD_CXX_FLAG_${CHECK_VAR}")

    check_cxx_compiler_flag(${FLAG} ${CHECK_VAR})

    if(${CHECK_VAR})
        message(STATUS "Enabling CXX compiler flag: ${FLAG}")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${FLAG}" PARENT_SCOPE)
    else()
        message(STATUS "Not enabling CXX compiler flag: ${FLAG}")
    endif()
endfunction()

macro(add_linker_flag FLAG)
    set(CMAKE_EXE_LINKER_FLAGS      "${CMAKE_EXE_LINKER_FLAGS} ${FLAG}")
    set(CMAKE_SHARED_LINKER_FLAGS   "${CMAKE_SHARED_LINKER_FLAGS} ${FLAG}")
    set(CMAKE_MODULE_LINKER_FLAGS   "${CMAKE_MODULE_LINKER_FLAGS} ${FLAG}")
endmacro()

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
    get_cmake_property(NAMES VARIABLES)

    foreach(NAME ${NAMES})
        if(NAME MATCHES "^(ENABLE|OS|HOST_OS|CXX)_")
            message(STATUS "${NAME}: ${${NAME}}")
        endif()
    endforeach()
endfunction()

macro(detect_git_revision VAR)
    execute_process(
        COMMAND git rev-parse --short HEAD
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        OUTPUT_VARIABLE ${VAR}
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
endmacro()
