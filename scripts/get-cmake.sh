#!/bin/bash

set -e

cd "$(dirname $0)/.."

rm -rf tools/cmake
mkdir -p tools/cmake
cd tools/cmake

wget -nv -O cmake.tar.gz https://cmake.org/files/v3.9/cmake-3.9.1-Linux-x86_64.tar.gz
echo 'ecbaf72981ccd09d9dade6d580cf1213eef15ef95a675dd9d4f0d693f134644f *cmake.tar.gz' | sha256sum -c
tar xf cmake.tar.gz --strip-components=1
rm cmake.tar.gz
