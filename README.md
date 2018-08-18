# beefweb
Web interface and HTTP API plugin for [DeaDBeeF](https://deadbeef.sourceforge.net/)
and [foobar2000](https://foobar2000.org/) music players.

[![License](https://img.shields.io/github/license/hyperblast/beefweb.svg)](LICENSE)
[![Build Status - Travis](https://travis-ci.org/hyperblast/beefweb.svg?branch=master)](https://travis-ci.org/hyperblast/beefweb)
[![Build Status - AppVeyor](https://ci.appveyor.com/api/projects/status/github/hyperblast/beefweb?branch=master&svg=true)](https://ci.appveyor.com/project/hyperblast/beefweb)

### Features
- Lightweight web user interface
- Playback control
- Playlist management
- Music directory browser
- Realtime UI updates
- Responsive layouts with support for screen sizes down to 320px
- The same HTTP/JSON API is available for controlling player from your application

### Downloads
There are no official releases yet.
However development builds should be stable enought for general use.
You could [download them here](https://hyperblast.org/beefweb/builds).
Choose latest available date and pick the file specific to your CPU architecture.

### How to install
#### DeaDBeeF
Unpack `ddb_beefweb-*.tar.gz` to `$HOME/.local/lib/deadbeef`.
#### foobar2000
Open `foo_beefweb-*.fb2k-component` with foobar2000, you will be asked to install the plugin.

### How to use
Point your browser to `http://localhost:8880` and enjoy your web interface.

If you've enabled remote connections on plugin configuration screen
you'll be able to connect from remote machines as well.

To allow browsing and adding files via web interface
specify music directories in plugin configuration screen.
For DeaDBeeF multiple music directories should be separated with `;`.

### Screenshots
![Main web interface](https://user-images.githubusercontent.com/19171756/34213888-b205be72-e5b1-11e7-9f77-5657979d0587.png)
![Configuration screen](https://user-images.githubusercontent.com/19171756/34526667-40ce832a-f0b4-11e7-8918-16180b6a66ad.png)

### How to build
#### DeaDBeeF
Beefweb has two distinctive parts: server plugin and web user interface.
To build server you'll need a descent C++ compiler such as `gcc` or `clang` and a recent version of `cmake`.
To build web UI you'll need `node` runtime and `yarn` package manager.

The following command will build server, ui and `.tar.gz` package:

    $ scripts/build.sh --all --release

Get `ddb_beefweb-*.tar.gz` from `build/release` directory.

You could also build debug version by switching `--release` to `--debug`.

#### foobar2000
You'll need to install Visual Studio (currently tested with VS2015 Community).
The following programs should be installed in addition:
`node` runtime, `yarn` package manager, `cmake` build system, `7z` archiver and `curl` HTTP client.
These programs should be available in `PATH`.

Open Visual Studio command prompt, navigate to project directory, run the following command:

    > msbuild scripts\build.proj /p:Configuration=Release

Get `foo_beefweb-*.fb2k-component` from `build\release` directory.

You could also build debug version by switching `/p:Configuration=Release` to `/p:Configuration=Debug`

### HTTP API
Swagger API definition is [available](https://hyperblast.org/beefweb/api).
