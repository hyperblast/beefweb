#!/bin/bash

set -e

function main
{
    scripts/build.sh --server --$BUILD_TYPE --tests --verbose \
        -DENABLE_WERROR=ON -DENABLE_STATIC_STDLIB=ON -DENABLE_GIT_REV=ON
}

DOCKER_IMAGE=beefweb-dev-oldlibc

source "$(dirname $0)/run-in-docker.sh"
