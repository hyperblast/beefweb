# beefweb
Web interface plugin for [DeaDBeeF](https://deadbeef.sourceforge.io/)
and [foobar2000](https://foobar2000.org/) music players.

[![License](https://img.shields.io/github/license/hyperblast/beefweb.svg)](LICENSE)
[![Build Status](https://github.com/hyperblast/beefweb/actions/workflows/build.yml/badge.svg)](https://github.com/hyperblast/beefweb/actions/workflows/build.yml)

### Features
- Lightweight web user interface
- Playback control
- Playlist management
- Music directory browser
- Real-time UI updates
- Mobile-friendly responsive design
- REST-like API for controlling player from your application

### Browser support
- Any recent browser should work
- Due to high development effort required Internet Explorer of any version is not supported

### Downloads
Check out [releases section](https://github.com/hyperblast/beefweb/releases).

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

See [advanced configuration guide](docs/advanced-config.md) to unlock hidden developer features.

### Donations

If you like this project [feel free to donate](https://hyperblast.org/donate/). Any amount is appreciated.

### Peer projects

[beefweb_dotnet](https://github.com/hyperblast/beefweb_dotnet) project provides command line client
as well as client library for .NET.

### Screenshots
![Main web interface on Linux](https://user-images.githubusercontent.com/19171756/44335589-a3286180-a47d-11e8-8db4-fd7708e262c6.png)

![Configuration screen for DeaDBeeF](https://user-images.githubusercontent.com/19171756/34526667-40ce832a-f0b4-11e7-8918-16180b6a66ad.png)

![Main web interface on Windows](https://user-images.githubusercontent.com/19171756/44335572-93108200-a47d-11e8-9ab4-7e51771353cf.png)

![Configuration screen for foobar2000](https://user-images.githubusercontent.com/19171756/44335583-9c015380-a47d-11e8-9934-639503538f8e.png)

### How to build

See [building instructions](docs/building.md).

### HTTP API
Swagger API definition is [available](https://hyperblast.org/beefweb/api).
