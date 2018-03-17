#!/bin/bash

set -e

if [ -z "$UPLOAD_CREDS" ]; then
    echo '$UPLOAD_CREDS is not defined, aborting upload'
    exit 1
fi

source "$(dirname $0)/config.sh"
cd "$(dirname $0)/.."

pkg_file=$(ls build/release/$pkg_name-*.tar.gz)
build_date=$(date -u -r "$pkg_file" +%F)
upload_url="https://hyperblast.org/uploads/$project_name/builds/$build_date/"
curl_args="--silent --fail --show-error --http1.1 --anyauth --user $UPLOAD_CREDS"

echo "Creating artifacts directory: $upload_url"
curl $curl_args -X MKCOL "$upload_url" || true

echo "Uploading artifact: $pkg_file"
curl $curl_args -T "$pkg_file" "$upload_url"
