include(CheckCXXCompilerFlag)

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