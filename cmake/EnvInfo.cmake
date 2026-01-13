set(OS_WINDOWS  OFF)
set(OS_POSIX    OFF)
set(OS_MAC      OFF)
set(OS_LINUX    OFF)

if(CMAKE_SYSTEM_NAME STREQUAL Windows)
    set(OS_WINDOWS ON)
    set(SHARED_LIB_SUFFIX .dll)
endif()

if(UNIX)
    set(OS_POSIX ON)
    set(SHARED_LIB_SUFFIX .so)
endif()

if(NOT OS_WINDOWS AND NOT OS_POSIX)
    message(SEND_ERROR "Target OS is not Windows or POSIX")
endif()

if(CMAKE_SYSTEM_NAME STREQUAL Linux)
    set(OS_LINUX ON)
endif()

if(CMAKE_SYSTEM_NAME STREQUAL Darwin)
    set(SHARED_LIB_SUFFIX .dylib)
endif()

set(HOST_OS_WINDOWS OFF)
set(HOST_OS_POSIX   OFF)

if(CMAKE_HOST_SYSTEM_NAME MATCHES "^Windows.*")
    set(HOST_OS_WINDOWS ON)
    set(SCRIPT_SUFFIX .cmd)
else()
    set(HOST_OS_POSIX ON)
    set(SCRIPT_SUFFIX .sh)
endif()

set(CXX_GCC     OFF)
set(CXX_CLANG   OFF)
set(CXX_MSVC    OFF)

if(CMAKE_CXX_COMPILER_ID STREQUAL GNU)
    set(CXX_GCC ON)
elseif(CMAKE_CXX_COMPILER_ID STREQUAL Clang)
    set(CXX_CLANG ON)
elseif(CMAKE_CXX_COMPILER_ID STREQUAL AppleClang)
    set(CXX_CLANG ON)
elseif(MSVC)
    set(CXX_MSVC ON)
endif()

get_property(IS_MULTI_CONFIG GLOBAL PROPERTY GENERATOR_IS_MULTI_CONFIG)
