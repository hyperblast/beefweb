#!/bin/bash

set -e

scripts_dir=$(readlink -f $(dirname $0))
root_dir=$(readlink -f $scripts_dir/..)

function usage
{
    usage_text="Usage: $(basename $0) target update_type

Change current version and patch related files

Targets:
    app         patch server and web UI files
    jslib       patch JS client library files

Update types:
    major       increment major version, minor is reset to 0, final is reset to 0
    minor       increment minor version, final is reset to 0
    dev         mark version as development (final=0)
    final       mark version as final aka release (final=1)
    refresh     patch all with current version
"

    echo "$usage_text"
    exit 1
}

function parse_version
{
    major=$(echo $1 | (IFS=.; read a b c; echo $a))
    minor=$(echo $1 | (IFS=.; read a b c; echo $b))
}

function init_app
{
    source "$(dirname $0)/config.sh"
    parse_version "$pkg_version"
    final=$pkg_version_final
}

function init_jslib
{
    parse_version "$(jq -r .version $root_dir/js/client/package.json)"
    final=0
}

function update_package_json
{
    sed -i "s|\"version\".*|\"version\": \"$version.0\",|" "$1/package.json"
}

function update_app
{
    if [ "$final" -ne 0 ]; then
        final_bool=True
    else
        final_bool=False
    fi

    cd "$scripts_dir"
    sed -i "s|pkg_version=.*|pkg_version=$version|" config.sh
    sed -i "s|pkg_version_final=.*|pkg_version_final=$final|" config.sh
    sed -i "s|<PackageVersion>.*|<PackageVersion>$version</PackageVersion>|" config.props
    sed -i "s|<PackageVersionFinal>.*|<PackageVersionFinal>$final_bool</PackageVersionFinal>|" config.props

    cd "$root_dir/server/src"
    sed -i "s|#define MSRV_VERSION_MAJOR.*|#define MSRV_VERSION_MAJOR      $major|" project_info.hpp
    sed -i "s|#define MSRV_VERSION_MINOR.*|#define MSRV_VERSION_MINOR      $minor|" project_info.hpp
    sed -i "s|#define MSRV_VERSION_FINAL.*|#define MSRV_VERSION_FINAL      $final|" project_info.hpp

    cd "$root_dir/js"
    update_package_json api_tests
    update_package_json webui
}

function update_jslib
{
    update_package_json "$root_dir/js/client"
}

case "$1" in
    app)
        init_app
        update_func=update_app
        ;;

    jslib)
        init_jslib
        update_func=update_jslib
        ;;

    *)
        usage
        ;;
esac


case "$2" in
    major)
        major=$((major + 1))
        minor=0
        final=0
        ;;

    minor)
        minor=$((minor + 1))
        final=0
        ;;

    dev)
        final=0
        ;;

    final)
        final=1
        ;;

    refresh)
        ;;

    *)
        usage
        ;;
esac

version=$major.$minor
$update_func
