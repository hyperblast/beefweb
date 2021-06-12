#!/bin/bash

set -e

cd "$(dirname $0)/../.."

scripts/install/deadbeef.sh v0.7
scripts/install/deadbeef.sh v1.8
