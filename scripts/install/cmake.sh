#!/bin/bash

set -e

"$(dirname $0)/install.sh" cmake \
    'https://github.com/Kitware/CMake/releases/download/v3.25.2/cmake-3.25.2-linux-x86_64.tar.gz' \
    '783da74f132fd1fea91b8236d267efa4df5b91c5eec1dea0a87f0cf233748d99'
