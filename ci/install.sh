#!/bin/bash

set -e

function main
{
    scripts/install/cmake.sh
    scripts/install/node.sh
    scripts/install/deadbeef.sh v1.8
    scripts/install/deadbeef.sh v1.9
}

DOCKER_IMAGE=beefweb-dev:ubuntu-14.04

source "$(dirname $0)/run-in-docker.sh"
