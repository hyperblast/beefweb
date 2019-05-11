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
upload_url="https://hyperblast.org/uploads/$project_name/builds/$build_date"
curl_args="--silent --fail --show-error --http1.1 --anyauth --user $UPLOAD_CREDS"

function upload
{
    echo "Creating artifacts directory: $1"
    curl $curl_args -X MKCOL "$1/" || true

    echo "Uploading artifact: $2"
    curl $curl_args -T "$2" "$1/"
}

upload "$upload_url" "$pkg_file"

if [ -f "$pkg_debug_file" ]; then
    upload "$upload_url/debug" "$pkg_debug_file"
fi
