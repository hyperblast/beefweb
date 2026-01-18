#!/bin/bash

set -e

function main
{
    scripts/install_app.sh everything
}

source "$(dirname $0)/run_in_docker.sh"
