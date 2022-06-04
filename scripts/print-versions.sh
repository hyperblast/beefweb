#!/bin/bash

set -e
echo '---'

g++ --version
echo '---'

cmake --version
echo '---'

echo -n 'node: '
node --version
echo '---'

echo -n 'yarn: '
yarn --version
echo '---'
