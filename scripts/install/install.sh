#!/bin/bash

set -e

name="$1"
url="$2"
hash="$3"

if [ -z "$name" ] || [ -z "$url" ] || [ -z "$hash" ]; then
    echo "usage: $(basename $0) <name>|global <url> <hash>"
    exit 1
fi

file="${url##*/}"

if [ "$name" = "global" ]; then
    cd /usr/local
else
    cd "$(dirname $0)/../.."

    install_dir="apps/$name"

    rm -rf "$install_dir"
    mkdir -p "$install_dir"
    cd "$install_dir"
fi

curl --silent --fail --show-error --location -o "$file" "$url"
echo "$hash *$file" | sha256sum -c
tar xf "$file" --strip-components=1
rm "$file"
