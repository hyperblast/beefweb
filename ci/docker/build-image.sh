#!/bin/bash

set -e

cd "$(dirname $0)"

if [ -z "$DOCKER_IMAGE" ]; then
    echo DOCKER_IMAGE is required
    exit 1
fi

docker_file="$DOCKER_IMAGE.dockerfile"

if ! [ -f "$docker_file" ]; then
    echo "$docker_file does not exist"
    exit 1
fi

docker build -t "beefweb-dev:$DOCKER_IMAGE" -f "$docker_file" .
