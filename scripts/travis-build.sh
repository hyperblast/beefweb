#!/bin/bash

set -e

cd "$(dirname $0)/.."

case "$TARGET_ARCH" in
    x86)
        export CFLAGS=-m32
        export CXXFLAGS=-m32
        ;;

    x86_64)
        export CFLAGS=
        export CXXFLAGS=
        ;;

    *)
        echo "Unsupported target arch: $TARGET_ARCH"
        exit 1
        ;;
esac


is_gcc=

if [ "$CC" = gcc ]; then
    export CC=gcc-6
    export CXX=g++-6
    is_gcc=1
fi

function banner()
{
    echo
    echo "=== $1 ==="
    echo
}

banner 'Downloading deadbeef binaries'
scripts/get-deadbeef.sh

banner 'Downloading cmake binaries'
scripts/get-cmake.sh
export PATH="$(pwd)/tools/cmake/bin:$PATH"

banner 'Building everything'
scripts/build.sh --all --release --tests --verbose \
    -DENABLE_WERROR=ON -DENABLE_STATIC_STDLIB=ON

banner 'Running server tests'
server/build/release/src/tests/core_tests

banner 'Running API tests'
(cd api/tests; yarn install; API_TESTS_BUILD_TYPE=release yarn run test)

if [ -n $is_gcc ] && [ "$TRAVIS_BRANCH" = master ] && [ "$TRAVIS_PULL_REQUEST" = false ]; then
    banner 'Uploading artifacts'
    scripts/upload.sh
fi
