#!/bin/bash

set -e

name="$1"
url="$2"
hash="$3"

if [ -z "$name" ] || [ -z "$url" ] || [ -z "$hash" ]; then
    echo "usage: $(basename $0) <name> <url> <hash>"
    exit 1
fi

file="${url##*/}"

cd "$(dirname $0)/.."

rm -rf "tools/$name"
mkdir -p "tools/$name"
cd "tools/$name"

curl --silent --fail --show-error --location -o "$file" "$url"
echo "$hash *$file" | sha256sum -c
tar xf "$file" --strip-components=1
rm "$file"
