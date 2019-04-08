#!/bin/bash

set -e

version="$1"
arch="$2"

if [ "$arch" = "" ]; then
    arch=x86_64
fi

case "$version|$arch" in
    'v0.7|x86')
        url='https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_i686.tar.bz2'
        hash='cfac56c37d55ccebf934d3b8c0a2b0ae7acf809e9c5aa5dcf6ff0b5a281a4e5b'
        ;;

    'v0.7|x86_64')
        url='https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_x86_64.tar.bz2'
        hash='f4ce44690ad80feddfb50b91a75d58b1edbd1cd6491f22d0a67f00debbaea6fc'
        ;;

    'v1.8|x86_64')
        url='https://sourceforge.net/projects/deadbeef/files/deadbeef-static_1.8.0-1_x86_64.tar.bz2'
        hash='57199b46aeca3ab057d97838e551a669218d6eb9638427c9cc6018686d888912'
        ;;

    *)
        echo "usage: $(basename $0) <version> [<arch>]"
        exit 1
        ;;
esac

"$(dirname $0)/install.sh" "deadbeef/$version/$arch" "$url" "$hash"
