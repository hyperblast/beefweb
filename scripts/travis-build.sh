#!/bin/bash

set -ve

cd "$(dirname $0)/.."

scripts/get-cmake.sh
export PATH="$(pwd)/tools/cmake/bin:$PATH"

upload_artifacts=

if [ "$CC" = "gcc" ]; then
    export CC=gcc-6
    export CXX=g++-6
    upload_artifacts=1
fi

scripts/build.sh --all --release --tests --verbose --werror

server/build/release/src/run_tests

if [ -n "$upload_artifacts" ]; then
    scripts/upload.sh
fi
