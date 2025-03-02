#!/bin/bash

set -e

main_repo_dir=`readlink -f "$(dirname $0)/.."`
dotnet_repo_dir=`readlink -f "$main_repo_dir/../beefweb_dotnet"`

function usage
{
    usage_text="Usage: $(basename $0) <repo> <update_type>

Change current version and patch related files

Repositories:
    main        main repo (server, webui, etc)
    dotnet      dotnet repo (client, command line tool, etc)

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

function init_version
{
    cd "$root_dir"

    source "version.sh"

    major=$(echo $version | (IFS=.; read a b; echo $a))
    minor=$(echo $version | (IFS=.; read a b; echo $b))
}

function update_version_sh
{
    sed -i "s|version=.*|version=$version|" version.sh
    sed -i "s|final=.*|final=$final|" version.sh
}

function update_package_json
{
    sed -i "s|\"version\":.*|\"version\": \"${version3}\",|" "$1/package.json"
}

function update_main
{
    cd "$main_repo_dir"

    update_version_sh

    sed -Ei "s|    VERSION [0-9.]+|    VERSION $version|" CMakeLists.txt
    sed -Ei "s|set\(PROJECT_VERSION_FINAL .\)|set(PROJECT_VERSION_FINAL $final)|" CMakeLists.txt

    cd "$main_repo_dir/js"

    update_package_json api_tests
    update_package_json client
    update_package_json webui

    cd "$main_repo_dir/docs"

    sed -i "s|version: '.*'|version: '$version'|" player-api.yml
}

function update_dotnet
{
    cd "$dotnet_repo_dir"

    update_version_sh

    sed -i "s|<Version>.*</Version>|<Version>${version3}${version_suffix}</Version>|" Directory.Build.props
}

function add_change_log_entry
{
    cd "$root_dir"

    change_log_data="# Changes in v$version (not released)


$(cat ChangeLog.md)"

    echo "$change_log_data" > ChangeLog.md
}

function mark_change_log_entry_as_released
{
    cd "$root_dir"
    release_date=$(date -u +%F)
    sed -i "s|v$version (.*)|v$version (released $release_date)|" ChangeLog.md
}

function unmark_change_log_entry_as_released
{
    cd "$root_dir"
    sed -i "s|v$version (.*)|v$version (not released)|" ChangeLog.md
}

update_change_log=""

case "$1" in
    main)
        root_dir="$main_repo_dir"
        update_version=update_main
        ;;

    dotnet)
        root_dir="$dotnet_repo_dir"
        update_version=update_dotnet
        ;;

    *)
        usage
        ;;
esac

init_version

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

version="$major.$minor"
version3="$version.0"

if [ $final -eq 0 ]; then
    version_suffix='-dev'
else
    version_suffix=''
fi

$update_version
$update_change_log
