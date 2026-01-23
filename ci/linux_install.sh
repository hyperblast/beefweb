#!/bin/bash

set -e

function main
{
    (cd js && yarn install)

    js/api_tests/src/install_app.js everything
}

source "$(dirname $0)/run_in_docker.sh"
