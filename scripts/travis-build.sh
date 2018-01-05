#!/bin/bash

set -e

cd "$(dirname $0)/.."

upload_artifacts=

if [ "$CC" = "gcc" ]; then
    export CC=gcc-6
    export CXX=g++-6
    upload_artifacts=1
fi

echo
echo '=== Downloading deadbeef binaries ==='
echo

scripts/get-deadbeef.sh

echo
echo '=== Downloading cmake binaries ==='
echo

scripts/get-cmake.sh
export PATH="$(pwd)/tools/cmake/bin:$PATH"

echo
echo '=== Building everything ==='
echo

scripts/build.sh --all --release --tests --verbose --werror

echo
echo '=== Running server tests ==='
echo

server/build/release/src/tests/server_tests

echo
echo '=== Running API tests ==='
echo

(cd api/tests; yarn install; API_TESTS_BUILD_TYPE=release yarn run test)

if [ -n "$upload_artifacts" ]; then
    echo
    echo '=== Uploading artifacts ==='
    echo

    scripts/upload.sh
fi
