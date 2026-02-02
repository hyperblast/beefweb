#!/bin/sh

set -e

cd "$(dirname $0)/static"

convert -background none app.svg -scale 512x512 -quality 100 app.png
convert app.svg -gravity center -scale 490x490 -extent 512x512 -quality 100 app-background.png
convert app.svg -gravity center -scale 350x350 -extent 512x512 -quality 100 app-maskable.png
