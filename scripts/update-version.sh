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

    cd "$root_dir/cpp/server"
    sed -i "s|#define MSRV_VERSION_MAJOR.*|#define MSRV_VERSION_MAJOR      $major|" project_info.hpp
    sed -i "s|#define MSRV_VERSION_MINOR.*|#define MSRV_VERSION_MINOR      $minor|" project_info.hpp
    sed -i "s|#define MSRV_VERSION_FINAL.*|#define MSRV_VERSION_FINAL      $final|" project_info.hpp

    cd "$root_dir/js"
    update_package_json api_tests
    update_package_json webui

    cd "$root_dir/docs"
    sed -i "s|version: '.*'|version: '$major.$minor'|" player-api.yml
}

function update_jslib
{
    update_package_json "$root_dir/js/client"
}

function add_change_log_entry
{
    cd "$root_dir/docs"

    change_log_data="### Changes in v$version (not released):


$(cat change-log.md)"

    echo "$change_log_data" > change-log.md
}

function mark_change_log_entry_as_released
{
    cd "$root_dir/docs"
    release_date=$(date -u +%F)
    sed -i "s|v$version (.*)|v$version (released $release_date)|" change-log.md
}

function unmark_change_log_entry_as_released
{
    cd "$root_dir/docs"
    sed -i "s|v$version (.*)|v$version (not released)|" change-log.md
}

update_change_log=""

case "$1" in
    app)
        init_app
        update_version=update_app
        ;;

    jslib)
        init_jslib
        update_version=update_jslib
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
        update_change_log=add_change_log_entry
        ;;

    minor)
        minor=$((minor + 1))
        final=0
        update_change_log=add_change_log_entry
        ;;

    dev)
        final=0
        update_change_log=unmark_change_log_entry_as_released
        ;;

    final)
        final=1
        update_change_log=mark_change_log_entry_as_released
        ;;

    refresh)
        if [ $final -ne 0 ]; then
            update_change_log=mark_change_log_entry_as_released
        else
            update_change_log=unmark_change_log_entry_as_released
        fi
        ;;

    *)
        usage
        ;;
esac

version=$major.$minor

$update_version

if [ $update_version = update_app ]; then
    $update_change_log
fi
