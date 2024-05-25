#!/bin/bash

set -e

version="$1"

case "$version" in
    'v1.8')
        url='https://sourceforge.net/projects/deadbeef/files/deadbeef-static_1.8.0-1_x86_64.tar.bz2'
        hash='57199b46aeca3ab057d97838e551a669218d6eb9638427c9cc6018686d888912'
        ;;

    'v1.9')
        url='https://sourceforge.net/projects/deadbeef/files/travis/linux/1.9.6/deadbeef-static_1.9.6-1_x86_64.tar.bz2'
        hash='aa17741053f63a7fceace003bf269bd4c4c9e55e42ee14286d9fbf34fbc8e014'
        ;;

    *)
        echo "usage: $(basename $0) <version>"
        exit 1
        ;;
esac

"$(dirname $0)/install.sh" "deadbeef/$version" "$url" "$hash"
