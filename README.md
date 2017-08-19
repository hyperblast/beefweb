# beefweb
Web user interface and HTTP API plugin for DeaDBeeF player

[![Build Status](https://travis-ci.org/hyperblast/beefweb.svg?branch=master)](https://travis-ci.org/hyperblast/beefweb)

### Features
- Lightweight web user interface
- Control playback
- Manage playlists
- Browse music directories
- Realtime UI updates
- Responsive layouts with support for screen sizes down to 320px
- Use the the same HTTP/JSON API for controlling player from your application

### How to build
Beefweb has two distinctive parts: server plugin and web user interface.
To build server you need a descent C++ compiler such as GCC.
To build web UI you need `nodejs` and `yarn` package manager.
Build process is automated, in most cases `scripts/build.sh --all --release` will build everything
and create package in `build/release` directory.

### How to install
Unpack `beefweb-*.tar.gz` to `$HOME/.local/lib/deadbeef`.

### How to use
Point your browser to `http://localhost:8880` and enjoy your web interface.
If you've enabled remote connections on plugin configuration screen you'll be able to connect from remote machines as well.
To allow browsing and adding files via web interface
specify browsable directories in plugin configuration screen (separate multiple entries with `;`).

### License
[MIT](LICENSE)
