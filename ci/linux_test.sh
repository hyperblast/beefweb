#!/bin/bash

set -e

TEST_RETRY=1
HAS_ERRORS=0

function banner
{
    echo
    echo "=== $1 ==="
    echo
}

function run_server_tests
{
    banner 'Running server tests'
    ci_build/$BUILD_TYPE/cpp/server/tests/core_tests || HAS_ERRORS=1
}

function run_deadbeef_tests
{
    banner "Running API tests on deadbeef $1"

    export BEEFWEB_TEST_PLAYER=deadbeef
    export BEEFWEB_TEST_DEADBEEF_VERSION=$1

    (cd js/api_tests && yarn test --retry $TEST_RETRY) || HAS_ERRORS=1
}

function main
{
    run_server_tests

    export BEEFWEB_BINARY_DIR_BASE=ci_build
    export BEEFWEB_TEST_BUILD_TYPE=$BUILD_TYPE

    for version in $(js/api_tests/src/install_app.js list-versions deadbeef); do
        run_deadbeef_tests $version
    done

    exit $HAS_ERRORS
}

source "$(dirname $0)/run_in_docker.sh"
