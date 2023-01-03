#!/bin/bash

set -e

function main
{
    scripts/build.sh --webui --pkg --$BUILD_TYPE --tests --verbose
}

source "$(dirname $0)/run-in-docker.sh"
