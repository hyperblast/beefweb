#!/bin/bash

set -e

case "$1" in
    debug|release|relwithdebinfo|minsizerel)
        build_type="$1"
        ;;
    *)
        echo "Usage: $(basename $0) build_type"
        echo "Build types: debug, release, relwithdebinfo, minsizerel"
        exit 1
        ;;
esac

if [ -z "$UPLOAD_CREDS" ]; then
    echo '$UPLOAD_CREDS is not defined, aborting upload'
    exit 1
fi

source "$(dirname $0)/config.sh"
cd "$(dirname $0)/../build/$build_type"

pkg_file=$(ls $pkg_name-*.tar.gz)
pkg_debug_file="${pkg_file/.tar.gz/.debug.tar.xz}"
build_date=$(date -u -r "$pkg_file" +%F)
upload_url="https://hyperblast.org/uploads/$project_name/builds/$build_date/"
curl_args="--silent --fail --show-error --http1.1 --anyauth --user $UPLOAD_CREDS"

echo "Creating artifacts directory: $upload_url"
curl $curl_args -X MKCOL "$upload_url" || true

echo "Uploading artifact: $pkg_file"
curl $curl_args -T "$pkg_file" "$upload_url"

if [ -f "$pkg_debug_file" ]; then
    echo "Uploading artifact (debug info): $pkg_debug_file"
    curl $curl_args -T "$pkg_debug_file" "$upload_url"
fi
