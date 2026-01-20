#!/bin/bash

set -e

"$(dirname $0)/install.sh" \
    'https://unofficial-builds.nodejs.org/download/release/v22.22.0/node-v22.22.0-linux-x64-glibc-217.tar.xz' \
    'db4a1d582e6fffcf7fb348149ca4ac8fa685699c5bc46cd7e22bbf9a7e673454'

export PATH="/usr/local/bin:$PATH"

npm i -g yarn@1.22.22
