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

if [ "$CC" = gcc ]; then
    export CC=gcc-6
    export CXX=g++-6
fi

function banner()
{
    echo
    echo "=== $1 ==="
    echo
}

banner 'Building everything'
scripts/build.sh \
    --all --release --tests --verbose \
    -DENABLE_WERROR=ON -DENABLE_STATIC_STDLIB=ON

export BEEFWEB_TEST_BUILD_TYPE=release
export BEEFWEB_USE_BEAST=1

banner 'Running server tests'
server/build/release/src/tests/core_tests

banner 'Running API tests'
(cd js/api_tests; yarn install; yarn test)
