#!/bin/bash

set -e

cd "$(dirname $0)/../install"

./deadbeef.sh v0.7 "$TARGET_ARCH"

if [ "$TARGET_ARCH" = "x86_64" ]; then
    ./deadbeef.sh v1.8 "$TARGET_ARCH"
fi
