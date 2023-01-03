#!/bin/bash

set -e

cd "$(dirname $0)/.."

docker build -t beefweb-dev-main -f docker-main .
docker build -t beefweb-dev-oldlibc -f docker-oldlibc .
