#!/bin/bash

set -e

if [ -z "$UPLOAD_CREDS" ]; then
    echo '$UPLOAD_CREDS is not defined, skipping upload'
    exit 0
fi

source "$(dirname $0)/config.sh"
cd "$(dirname $0)/.."

pkg_file=$(ls build/release/$pkg_name-*.tar.gz)
build_date=$(date -u -r "$pkg_file" +%F)
upload_url="https://hyperblast.org/uploads/$pkg_name/builds/$build_date/"
curl_args="--http1.1 --anyauth --user $UPLOAD_CREDS -o /dev/null"

echo "Creating artifacts directory: $upload_url"
curl -X MKCOL "$upload_url" $curl_args || true

echo "Uploading artifact: $pkg_file"
curl -T "$pkg_file" "$upload_url" $curl_args
