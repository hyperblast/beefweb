#!/bin/bash

set -e

cd "$(dirname $0)/.."

plugin_file=beefweb.so
webui_root=beefweb.root

function relink
{
    if [ -L "$1" ]; then
        echo "removing existing link '$1'"
        rm "$1"
    elif [ -e "$1" ]; then
        echo "target '$1' exists and is not a symbolic link, aborting"
        exit 1
    fi

    echo "setting up link '$1' -> '$2'"
    ln -s "$2" "$1"
}

function install
{
    plugin_dir="$HOME/.local/lib/deadbeef"
    server_build_dir="$(pwd)/build/$1/cpp/server/deadbeef"
    webui_build_dir="$(pwd)/build/$1/js/webui/output"

    if [ ! -e "$plugin_dir" ]; then
        mkdir -p "$plugin_dir"
    fi

    relink "$plugin_dir/$plugin_file" "$server_build_dir/$plugin_file"
    relink "$plugin_dir/$webui_root" "$webui_build_dir"
}

usage="Adds symlinks in ~/.local/lib/deadbeef to binaries in current build directory

Usage:
    $(basename $0) <build_type>

Build types:
    Debug, Release, MinSizeRel, RelWithDebInfo
"

case "$1" in
    Debug|Release|MinSizeRel|RelWithDebInfo)
        install "$1"
        ;;


    ""|-?|--help)
        echo "$usage"
        ;;

    *)
        echo "invalid build type: $1, try --help"
        exit 1
        ;;
esac
