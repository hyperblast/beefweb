#!/bin/bash

set -e

function main
{
    scripts/install/cmake.sh
    scripts/install/deadbeef.sh v0.7
    scripts/install/deadbeef.sh v1.8
}

source "$(dirname $0)/run-in-docker.sh"
