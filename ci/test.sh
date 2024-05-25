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
    cpp/build/$BUILD_TYPE/server/tests/core_tests
}

function run_api_tests
{
    (
        banner "Running API tests on deadbeef $1"
        export BEEFWEB_TEST_DEADBEEF_VERSION=$1
        export BEEFWEB_TEST_BUILD_TYPE=$BUILD_TYPE
        tools/deadbeef/$1/deadbeef --version
        cd js/api_tests
        yarn test
    )
}

function main
{
    run_server_tests
    run_api_tests v1.8
    run_api_tests v1.9
}

source "$(dirname $0)/run-in-docker.sh"
