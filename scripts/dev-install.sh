#!/bin/bash

set -e

source "$(dirname $0)/config.sh"

cd "$(dirname $0)/.."

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
    server_build_dir="$(pwd)/server/build/$1/src/player_deadbeef"
    webui_build_dir="$(pwd)/js/webui/build/$1"

    if [ ! -e "$plugin_dir" ]; then
        mkdir -p "$plugin_dir"
    fi

    relink "$plugin_dir/$plugin_file" "$server_build_dir/$plugin_file"
    relink "$plugin_dir/$webui_root" "$webui_build_dir"
}

usage="Usage: $(basename $0) --debug|--release|--help
Options:
  --debug           install debug version
  --release         install release version
  --help            display this message
"

case "$1" in
    --debug)
        install debug
        ;;

    --release)
        install release
        ;;

    --help)
        echo "$usage"
        ;;

    "")
        echo "$usage"
        exit 1
        ;;

    *)
        echo "invalid option: $1"
        exit 1
        ;;
esac
