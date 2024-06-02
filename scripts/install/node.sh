#!/bin/bash

set -e

"$(dirname $0)/install.sh" global \
    'https://nodejs.org/dist/v12.22.12/node-v12.22.12-linux-x64.tar.xz' \
    'e6d052364bfa2c17da92cf31794100cfd709ba147415ddaeed2222eec9ca1469'

export PATH="/usr/local/bin:$PATH"

npm i -g yarn@1.22.22
