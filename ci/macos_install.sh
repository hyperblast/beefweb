#!/bin/bash

set -e

cd "$(dirname $0)/.."

(cd js && yarn install)

js/api_tests/src/install_app.js everything
