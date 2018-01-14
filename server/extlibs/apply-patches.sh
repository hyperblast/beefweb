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
    patch_files="$patches_dir/*.patch"

    for patch_file in $patch_files; do
        echo "applying $(basename $patch_file)"
        patch -p1 < "$patch_file"
    done
fi

if [ -d "$files_dir" ]; then
    (cd "$files_dir"; cp -v -t "$build_dir" *)
fi
