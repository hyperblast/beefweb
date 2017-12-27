#!/bin/bash

set -e

cd "$(dirname $0)/.."

rm -rf tools/deadbeef.x86
mkdir -p tools/deadbeef.x86
cd tools/deadbeef.x86

wget -nv -O deadbeef.tar.bz2 https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_i686.tar.bz2
echo 'cfac56c37d55ccebf934d3b8c0a2b0ae7acf809e9c5aa5dcf6ff0b5a281a4e5b *deadbeef.tar.bz2' | sha256sum -c
tar xf deadbeef.tar.bz2 --strip-components=1
rm deadbeef.tar.bz2

cd ../..

rm -rf tools/deadbeef.x86_64
mkdir -p tools/deadbeef.x86_64
cd tools/deadbeef.x86_64

wget -nv -O deadbeef.tar.bz2 https://sourceforge.net/projects/deadbeef/files/deadbeef-static_0.7.2-2_x86_64.tar.bz2
echo 'f4ce44690ad80feddfb50b91a75d58b1edbd1cd6491f22d0a67f00debbaea6fc *deadbeef.tar.bz2' | sha256sum -c
tar xf deadbeef.tar.bz2 --strip-components=1
rm deadbeef.tar.bz2
