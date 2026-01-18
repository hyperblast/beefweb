#!/bin/bash

set -e

cd "$(dirname $0)/.."

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

    export BEEFWEB_BINARY_DIR_BASE=ci_build
    export BEEFWEB_TEST_DEADBEEF_VERSION=$1
    export BEEFWEB_TEST_BUILD_TYPE=$BUILD_TYPE

    (cd js/api_tests && yarn test)
}

run_server_tests

for version in $(scripts/install_app.sh list-versions deadbeef); do
    run_deadbeef_tests $version
done
