#!/bin/bash

set -e

cd "$(dirname $0)/../install"

./deadbeef.sh v0.7
./deadbeef.sh v1.8
