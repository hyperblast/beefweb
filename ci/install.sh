#!/bin/bash

set -e

function main
{
    cd scripts/install

    ./deadbeef.sh v1.8
    ./deadbeef.sh v1.9
    ./deadbeef.sh v1.10
}

source "$(dirname $0)/run_in_docker.sh"
