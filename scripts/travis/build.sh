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

./build.sh \
    --all --release --tests --verbose \
    -DENABLE_WERROR=ON -DENABLE_STATIC_STDLIB=ON -DENABLE_GIT_REV=ON
