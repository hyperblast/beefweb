#!/bin/bash

set -e

version="$1"

case "$version" in
    'v1.8')
        url='https://sourceforge.net/projects/deadbeef/files/travis/linux/1.8.8/deadbeef-static_1.8.8-1_x86_64.tar.bz2'
        hash='2e65b41ac39ddbc08e60ef25695a7a9a928f4342e038c1cdf3bb8b234f419b9b'
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
