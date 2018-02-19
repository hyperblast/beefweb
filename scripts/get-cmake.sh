#!/bin/bash

set -e

"$(dirname $0)/fetch.sh" \
    cmake \
    'https://cmake.org/files/v3.9/cmake-3.9.1-Linux-x86_64.tar.gz' \
    ecbaf72981ccd09d9dade6d580cf1213eef15ef95a675dd9d4f0d693f134644f
