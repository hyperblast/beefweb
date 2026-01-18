#!/bin/bash

set -e

cd "$(dirname $0)/.."

if [ ! -f js/node_modules/.yarn-integrity ]; then
    (cd js && yarn install)
fi

exec js/api_tests/src/install_app.js $*
