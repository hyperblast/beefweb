#!/bin/bash

set -e

function banner
{
    echo
    echo "=== $1 ==="
    echo
}

function main
{
    banner 'Cleaning build directory'
    rm -rf ci_build/$BUILD_TYPE
    mkdir -p ci_build/$BUILD_TYPE
    cd ci_build/$BUILD_TYPE

    banner 'Configuring'
    cmake ../.. \
        -DCMAKE_BUILD_TYPE=$BUILD_TYPE \
        -DENABLE_TESTS=ON \
        -DENABLE_WERROR=ON \
        -DENABLE_STATIC_STDLIB=ON \
        -DENABLE_GIT_REV=ON

    banner 'Building'
    cmake --build . --parallel

    banner 'Creating packages'

    cmake . -DDEADBEEF_INSTALL_INTO_ROOT=ON
    cpack -G TXZ

    cmake . -DDEADBEEF_INSTALL_INTO_ROOT=OFF
    cpack -G DEB
}

source "$(dirname $0)/run_in_docker.sh"
