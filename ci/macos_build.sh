#!/bin/bash

set -e

function banner
{
    echo
    echo "=== $1 ==="
    echo
}

banner 'Cleaning build directory'
rm -rf ci_build/$BUILD_TYPE
mkdir -p ci_build/$BUILD_TYPE
cd ci_build/$BUILD_TYPE

banner 'Configuring'
cmake ../.. \
    -DCMAKE_BUILD_TYPE=$BUILD_TYPE \
    -DENABLE_TESTS=ON \
    -DENABLE_GIT_REV=ON

banner 'Building'
cmake --build . --parallel

banner 'Creating packages'
cmake . -DDEADBEEF_INSTALL_INTO_ROOT=ON
cpack

foo_pkg=$(ls foo_*.zip)
mv $foo_pkg $(basename $foo_pkg .zip).fb2k-component
