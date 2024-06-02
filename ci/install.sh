#!/bin/bash

set -e

function main
{
    scripts/install/deadbeef.sh v1.8
    scripts/install/deadbeef.sh v1.9
}

source "$(dirname $0)/run-in-docker.sh"
