#!/bin/sh

set -e

cd "$(dirname $0)/static"

convert -background none app.svg -scale 512x512 -quality 100 app.png
