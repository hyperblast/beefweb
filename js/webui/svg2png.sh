#!/bin/sh

set -e

cd "$(dirname $0)/static"

convert -background none logo-bg.svg -scale 512x512 -quality 100 logo-bg.png
