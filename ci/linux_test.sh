#!/bin/bash

set -e

set TEST_RETRY=1

function banner
{
    echo
    echo "=== $1 ==="
    echo
}

function run_server_tests
{
    banner 'Running server tests'
    ci_build/$BUILD_TYPE/cpp/server/tests/core_tests
}

function run_deadbeef_tests
{
    banner "Running API tests on deadbeef $1"

    export BEEFWEB_TEST_PLAYER=deadbeef
    export BEEFWEB_TEST_DEADBEEF_VERSION=$1

    (cd js/api_tests && yarn test --retry $TEST_RETRY)
}

function main
{
    run_server_tests

    export BEEFWEB_BINARY_DIR_BASE=ci_build
    export BEEFWEB_TEST_BUILD_TYPE=$BUILD_TYPE

    for version in $(scripts/install_app.sh list-versions deadbeef); do
        run_deadbeef_tests $version
    done
}

source "$(dirname $0)/run_in_docker.sh"
