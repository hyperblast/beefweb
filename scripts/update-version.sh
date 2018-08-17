#!/bin/bash

set -e

major=$1
minor=$2

if [ -z "$major" ] || [ -z "$minor" ]; then
    echo "usage: $(basename $0) major minor"
    exit 1
fi

version=$major.$minor

cd "$(dirname $0)"
sed -i "s|pkg_version=.*|pkg_version=$version|" config.sh
sed -i "s|<PackageVersion>.*|<PackageVersion>$version</PackageVersion>|" config.props

cd "$(dirname $0)/../server/src"
sed -i "s|#define MSRV_VERSION_MAJOR.*|#define MSRV_VERSION_MAJOR      $major|" project_info.hpp
sed -i "s|#define MSRV_VERSION_MINOR.*|#define MSRV_VERSION_MINOR      $minor|" project_info.hpp

cd "$(dirname $0)/../js"
sed -i "s|\"version\".*|\"version\": \"$version.0\",|" api_tests/package.json
sed -i "s|\"version\".*|\"version\": \"$version.0\",|" client/package.json
sed -i "s|\"version\".*|\"version\": \"$version.0\",|" webui/package.json
