#!/bin/bash

set -e

target="$1"

if [ -z "$target" ]; then
    echo "usage: $(basename $0) target"
    exit 1
fi

build_dir="$(pwd)"
src_dir="$(readlink -f $(dirname $0))/$target"
patches_dir="$src_dir/patches"
files_dir="$src_dir/files"

if [ -d "$patches_dir" ]; then
    for patch_file in $patches_dir/*.patch; do
        echo "applying $(basename $patch_file)"
        patch -p1 --batch < "$patch_file"
    done
fi

if [ -d "$files_dir" ]; then
    (cd "$files_dir"; cp -r -v -t "$build_dir" *)
fi
