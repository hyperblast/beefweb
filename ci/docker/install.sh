#!/bin/bash

set -e

url="$1"
hash="$2"

if [ -z "$url" ] || [ -z "$hash" ]; then
    echo "usage: $(basename $0) <url> <hash>"
    exit 1
fi

file="${url##*/}"

cd /usr/local

curl --silent --fail --show-error --location -o "$file" "$url"
echo "$hash *$file" | sha256sum -c
tar xf "$file" --strip-components=1
rm "$file"
