#!/bin/bash

set -e

cd "$(dirname $0)/../.."

if [ "$CC" = gcc ]; then
    export CC=gcc-6
    export CXX=g++-6
fi

scripts/build.sh \
    --all --$BUILD_TYPE --tests --verbose \
    -DENABLE_WERROR=ON -DENABLE_STATIC_STDLIB=ON -DENABLE_GIT_REV=ON
