# beefweb
Web interface and HTTP API plugin for [DeaDBeeF player](http://deadbeef.sourceforge.net/).

[![License](https://img.shields.io/github/license/hyperblast/beefweb.svg)](LICENSE)
[![Build Status](https://travis-ci.org/hyperblast/beefweb.svg?branch=master)](https://travis-ci.org/hyperblast/beefweb)

### Features
- Lightweight web user interface
- Playback control
- Playlist management
- Music directory browser
- Realtime UI updates
- Responsive layouts with support for screen sizes down to 320px
- The same HTTP/JSON API is available for controlling player from your application

### Screenshots

![Main web interface](https://user-images.githubusercontent.com/19171756/34213888-b205be72-e5b1-11e7-9f77-5657979d0587.png)

![Configuration screen](https://user-images.githubusercontent.com/19171756/29487824-4670cb16-8508-11e7-984f-14707cbbd52d.png)

### How to build
Beefweb has two distinctive parts: server plugin and web user interface.
To build server you'll need a descent C++ compiler such as `gcc` or `clang` and a recent version of `cmake`.
To build web UI you'll need `nodejs` and `yarn` package manager.

The following command will build server, ui and `.tar.gz` package:

    $ scripts/build.sh --all --release

Get `beefweb-*.tar.gz` from `build/release` directory.

You could also build debug version by switching `--release` to `--debug`.

### How to install
Unpack `beefweb-*.tar.gz` to `$HOME/.local/lib/deadbeef`.

### How to use
Point your browser to `http://localhost:8880` and enjoy your web interface.

If you've enabled remote connections on plugin configuration screen you'll be able to connect from remote machines as well.

To allow browsing and adding files via web interface
specify music directories in plugin configuration screen (multiple entries are separated with `;`).

### Development builds

Development builds are [available](https://hyperblast.org/beefweb/builds).

### HTTP API

Swagger API definition is in progress. [Check it out](https://hyperblast.org/beefweb/api).
