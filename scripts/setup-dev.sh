#!/bin/bash

set -e

source "$(dirname $0)/config.sh"

cd "$(dirname $0)/.."

function relink()
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

plugin_dir="$HOME/.local/lib/deadbeef"

if [ ! -e "$plugin_dir" ]; then
    mkdir -p "$plugin_dir"
fi

relink \
    "$plugin_dir/$plugin_file" \
    "$(pwd)/server/build/debug/src/plugin_deadbeef/$plugin_file"
    
relink \
    "$plugin_dir/$webui_root" \
    "$(pwd)/webui/build/debug"
