# Changes in v0.8 (not released)
- Use imperative present tense for change log entries
- Adjust screen size breakpoints (approximately 640px for medium size and 960px for large size)
- Convert view switcher to menu on small size screens
- Display album column by default on medium size screens

# Changes in v0.7 (released 2023-02-26)
- API specification is converted to OpenAPI v3
- Case insensitive string comparison is used for HTTP headers and query parameters
### DeaDBeeF
- Linear volume control is now used in web UI
- "Playback mode" option is split into separate "Repeat" and "Order" options
- Added "Stop after current track" and "Stop after current album" options
- Fixed occasional desync when switching tracks
### foobar2000
- Volume control now displays tooltip in dB
- Added "Stop after current" option
- Fixed settings page not honoring dark mode

# Changes in v0.6 (released 2023-01-14)
- Added dark theme for web UI
- Added x64 builds of foobar2000 plugin
- Improved settings screen styling
- "Use full screen width" checkbox is no longer displayed on small screens
- Binaries for foobar2000 are built with VS2022
- Updated foobar2000 SDK to 2022-11-16
- Updated boost to v1.81.0
- Updated nlohmann/json to v3.11.2
- Removed support for browsers without native EventSource implementation

# Changes in v0.5 (released 2021-10-24)
- Added support for specifying custom response header (e.g. for CORS)
- Added support for specifying custom web content directories
- Added settings to customize window title and playback information panel content
- Added support for different file browser add actions ("Add", "Add & Play", "Replace & Play")
- Improved dialog styling in web UI
- Clicking on status bar locates current track
- Binaries for DeaDBeeF x86 are no longer provided, you can still build manually
- Binaries for foobar2000 are built with VS2017 and dynamic runtime libraries
- Updated foobar2000 SDK to 2019-06-30
- Updated boost to v1.71
- Fixed preventing of foobar2000 update
- Fixed "Port:" label overflow in settings page
- Fixed error 500 when trying to browse directories with inaccessible files
- Fixed browsing of root directory (e.g. C:\\)
- Fixed volume slider vertical alignment

# Changes in v0.4 (released 2020-02-02)
- Added optional playback information panel
- Added basic support for playlist column customization
- Renamed "Audio menu" to "Playback mode"
- Fixed icons occasionally not being rendered on Chrome-based browsers
- Fixed non-latin music directories support
- Fixed "Add URL" not working
- Total playlist time status line is removed (foobar2000 only)
- Volume slider now uses linear scale instead of dB (foobar2000 only)
- Fixed browsing directories with `!` in path

# Changes in v0.3 (released 2018-09-20)
- Added button that locates currently played track
- Fixed volume and mute state not being synchronized
- Added "Cursor follows playback" option
- Implemented proper escaping for array query string parameters
- Added playlist sort operations
- Added "Play next/previous artist/album" operations

# Changes in v0.2 (released 2018-08-25)
- First official release
