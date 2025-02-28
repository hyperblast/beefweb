#!/bin/bash

set -e

function main
{
    rm -rf ci_build/$BUILD_TYPE
    mkdir -p ci_build/$BUILD_TYPE
    cd ci_build/$BUILD_TYPE

    cmake ../.. \
        -DCMAKE_BUILD_TYPE=$BUILD_TYPE \
        -DENABLE_TESTS=ON \
        -DENABLE_WERROR=ON \
        -DENABLE_STATIC_STDLIB=ON \
        -DENABLE_GIT_REV=ON

    cmake --build . --parallel

    cpack
}

source "$(dirname $0)/run-in-docker.sh"
