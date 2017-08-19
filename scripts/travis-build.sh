#!/bin/bash

set -ve

cd "$(dirname $0)/.."

scripts/get-cmake.sh
export PATH="$(pwd)/tools/cmake/bin:$PATH"

if [ "$CC" = "gcc" ]; then
    export CC=gcc-6
    export CXX=g++-6
fi

scripts/build.sh --all --release --tests --verbose --werror

server/build/release/src/run_tests
