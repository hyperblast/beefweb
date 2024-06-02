#!/bin/bash

set -e

cd "$(dirname $0)"

docker build -t beefweb-dev:ubuntu-22.04 -f ubuntu-22.04.dockerfile .
