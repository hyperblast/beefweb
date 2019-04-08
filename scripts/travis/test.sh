#!/bin/bash

set -e

function banner
{
    echo
    echo ">> $1 <<"
    echo
}

function run_server_tests
{
    banner 'Running server tests'
    server/build/$BUILD_TYPE/src/tests/core_tests
}

function run_api_tests
{
    (
        banner "Running API tests ($1)"
        export BEEFWEB_TEST_DEADBEEF_VERSION=$1
        export BEEFWEB_TEST_BUILD_TYPE=$BUILD_TYPE
        tools/deadbeef/$1/$TARGET_ARCH/deadbeef --version
        cd js/api_tests
        yarn test
    )
}


cd "$(dirname $0)/../.."
run_server_tests
run_api_tests v0.7

if [ "$TARGET_ARCH" = "x86_64" ]; then
    run_api_tests v1.8
fi
