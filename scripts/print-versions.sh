#!/bin/bash

set -e

g++ --version | head -n1
cmake --version | head -n1
echo -n 'node ' && node --version
echo -n 'yarn ' && yarn --version
