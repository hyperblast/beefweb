#!/bin/bash

set -e

version="$1"

case "$version" in
    'v0.7')
        url='https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_x86_64.tar.bz2'
        hash='f4ce44690ad80feddfb50b91a75d58b1edbd1cd6491f22d0a67f00debbaea6fc'
        ;;

    'v1.8')
        url='https://sourceforge.net/projects/deadbeef/files/deadbeef-static_1.8.0-1_x86_64.tar.bz2'
        hash='57199b46aeca3ab057d97838e551a669218d6eb9638427c9cc6018686d888912'
        ;;

    *)
        echo "usage: $(basename $0) <version>"
        exit 1
        ;;
esac

"$(dirname $0)/install.sh" "deadbeef/$version" "$url" "$hash"
