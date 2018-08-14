#!/bin/bash

set -e

cd "$(dirname $0)"

./install.sh \
    deadbeef.x86 \
    'https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_i686.tar.bz2' \
    cfac56c37d55ccebf934d3b8c0a2b0ae7acf809e9c5aa5dcf6ff0b5a281a4e5b

./install.sh \
    deadbeef.x86_64 \
    'https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_x86_64.tar.bz2' \
    f4ce44690ad80feddfb50b91a75d58b1edbd1cd6491f22d0a67f00debbaea6fc
