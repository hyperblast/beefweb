#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "usage: $0 target-name"
    exit 1
fi

for patch_file in $(dirname $0)/$1/*.patch; do
    echo "applying $(basename $patch_file)"
    patch -p1 < "$patch_file"
done

