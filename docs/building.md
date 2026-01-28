# Building instructions

Beefweb has two distinctive parts: server plugin (backend) and web user interface (frontend).

Server plugin is built using `cmake` and web interface is built using `webpack`.

`webpack` is fully integrated into CMake build process,
but could be run manually if only want to work on frontend only.

Additionally building frontend requires `node` runtime and `yarn` package manager.
Those should be available in `PATH`.

### Linux/macOS/*BSD

Currently tested on Linux (x86_64) with `gcc` and on macOS (ARM/x86_64) with 'clang'.
Other systems and compilers might or might not work.

Configure:

```
$ mkdir -p build/Release
$ cd build/Release
$ cmake ../.. -DCMAKE_BUILD_TYPE=Release
```

Build:
```
$ cmake --build . --parallel
```

If you want to develop backend change `Release` to `Debug` in the commands above
and add `-DENABLE_TESTS=ON` to cmake parameters.

Create .tar.xz package:
```
$ cmake . -DDEADBEEF_INSTALL_INTO_ROOT=ON
$ cpack -G ZIP # or TXZ
```

`ddb_beefweb-*.zip` will be created in `build/Release`.

On macOS `foo_beefweb-*.zip` will be created as well.

To make installable foobar2000 package change file extension from `.zip` to `.fb2k-component`.

Create .deb package (Linux only):
```
$ cmake . -DDEADBEEF_INSTALL_INTO_ROOT=OFF
$ cpack -G DEB
```

`deadbeef-beefweb_*.deb` will be created.

`DEADBEEF_INSTALL_INTO_ROOT` option affects directory layout inside package.
Make sure it is `ON` when creating `.tar.xz`, `.zip` or other archive and `OFF` when creating `.deb` package.

### Windows

Visual Studio is used to build backend. Currently tested with VS2022 Community.

During installation make sure to choose _Desktop development with C++_ workload.

Recent versions of VS include CMake, there is no need to install it separately.

`patch` program should be available in `PATH`.

Alternatively you can install it locally:
```
> cd js
> yarn install
> node api_tests\src\install_app.js patch
```

The command above will download and unpack `patch.exe` to `apps\patch`.

Open Visual Studio command prompt, navigate to project directory, run the following commands:

Configure:

```
> mkdir build\Release
> cd build\Release
> cmake ..\.. -A x64
```

This command creates Visual Studio solution `beefweb.sln`, which could be built in VS in usual way.
If you want to build 32-bit version replace `x64` with `Win32` in the `cmake` command above.

Alternatively you can build from console:
```
> cmake --build . --config Release --parallel
```

If you want to develop backend change `Release` to `Debug` in the commands above
and add `-DENABLE_TESTS=ON` to cmake parameters.

And create package:
```
> cpack -C Release
```

`foo_beefweb-*.zip` will be created in `build\Release` directory.

To make installable foobar2000 package change file extension from `.zip` to `.fb2k-component`.

Note: due to build system limitations you need to have separate build directories
for each build type (Debug, Release, etc).

### Investigating build issues

If one of the `ext_xxx` projects fails to build
usually this means issues with external project (downloading or building).

See `build/<BUILD_TYPE>/cpp/extlibs-root/src/ext_xxx-stamp` directory for various `.log` files.

### Building backend only

To build backend only pass `-DENABLE_JS=OFF` to `cmake` command during configuration.

### Building frontend only

It is possible to build frontend only.

Install packages (in `js` directory):
```
$ yarn install
```

Build frontend Release version (in `js/webui` directory):
```
$ yarn build --env buildType=Release
```

`buildType` could be any CMake build type. If not specified defaults to `Debug`.

By default webui artifacts are written to the following directories:

Linux/macOS/*BSD:
```
build/<BUILD_TYPE>/js/webui/output
```

Windows:
```
build\<BUILD_TYPE>\js\webui\<BUILD_TYPE>
```

Currently all non-Debug build types produce the same output, the only difference is the output directory.

To override output directory use `--env outputDir=path/to/dir` parameter.

It is possible to run `webpack` in watch mode, where any changes are continuously rebuilt:
```
$ yarn watch
```

This command supports `--env buildType` and `--env outputDir` with the same defaults.

### Running API tests

Full build needs to be performed before running API tests.

`curl` should be available in `PATH`.

Additionally player binaries should be installed:

Windows:
```
> node js\api_tests\src\install_app.js everything
```

Linux/macOS/*BSD:
```
$ js/api_tests/src/install_app.js everything
```

These commands download player distribution packages and unpack them to `apps/<PLAYER>/<VERSION>`.

Now it is possible to run tests (in `js/api_tests` directory):
```
$ yarn test
```

This command supports various parameters via environment variables:

`BEEFWEB_TEST_BUILD_TYPE` - which build type to use (defaults to `Debug`)

`BEEFWEB_TEST_PLAYER` - which player to test (`deadbeef` or `foobar2000`, defaults to `foobar2000` on macOS/Windows, `deadbeef` otherwise)

`BEEFWEB_TEST_FOOBAR2000_VERSION` - foobar2000 version to use (defaults to latest specified in `js/api_tests/apps.json`)

`BEEFWEB_TEST_DEADBEEF_VERSION` - DeaDBeeF version to use (defaults to latest specified in `js/api_tests/apps.json`)

These two variables could be useful if you don't want to use default directory layout `build/<BUILD_TYPE>`:

`BEEFWEB_BINARY_DIR` - CMake build directory

`BEEFWEB_BINARY_DIR_BASE` - parent of CMake build directories for all build types (defaults to `<project_root>/build`)

When both are specified `BEEFWEB_BINARY_DIR` takes precedence.

If the specified path is not absolute it is resolved relative to source code root directory.

When building frontend these two variables could be used instead of `--env outputDir`.
