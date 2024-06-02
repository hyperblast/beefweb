#!/bin/bash

set -e

function main
{
    scripts/build.sh --all --$BUILD_TYPE --tests --verbose \
        -DENABLE_WERROR=ON -DENABLE_STATIC_STDLIB=ON -DENABLE_GIT_REV=ON
}

source "$(dirname $0)/run-in-docker.sh"
