#!/bin/bash

set -e

if [ -z "$CXX" ]; then
    CXX=c++
fi

$CXX --version | head -n1
cmake --version | head -n1
echo -n 'node ' && node --version
echo -n 'yarn ' && yarn --version
