## Building instruction

Beefweb has two distinctive parts: server plugin (backend) and web user interface (frontend).
Server plugin is built using `cmake` and web interface is built using `webpack`.

`webpack` is fully integrated into `cmake` build process,
but could be run manually if only want to work frontend only.

Additionally building frontend requires `node` runtime and `yarn` package manager.
Those should be available in `PATH`.

### DeaDBeeF

Currently tested with Linux x86_64 and `gcc`. Other systems and compilers might or might not work.

Configure:

```
$ mkdir -p build/Release
$ cd build/Release
$ cmake -DCMAKE_BUILD_TYPE=Release ../..
```

Build:
```
$ cmake --build . --parallel
```

Create package:
```
$ cpack
```

`ddb_beefweb-*.tar.xz` will be created inside `build/Release`.

If you want to debug backend change `Release` to `Debug` in the commands above.

### foobar2000
You'll need to install Visual Studio (currently tested with VS2022 Community).

Open Visual Studio command prompt, navigate to project directory, run the following commands:

Configure:

```
> mkdir build\Release
> cd build\Release
> cmake ..\..
```

The command above creates Visual Studio solution `beefweb.sln`, which could be built in VS in usual way.

Alternatively you can build from console:
```
> cmake --build . --config Release
```

And create package:
```
> cpack
```

`foo_beefweb-*.zip` will be created in `build\Release` directory.
Change extension to `.fb2k-component` to install into foobar2000.

If you want to debug backend change `Release` to `Debug` in the commands above.

Note: due to build system limitations you need to have separate build directories
for each build type (Debug, Release, etc).

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

Linux:
```
build/<BUILD_TYPE>/js/webui/output
```

Windows:
```
build/<BUILD_TYPE>/js/webui/<BUILD_TYPE>
```

You can override this directory using `--env outputDir=path/to/dir` parameter.

It is possible to run `webpack` in watch mode, where any changes are continuously rebuilt:
```
$ yarn watch
```

This command supports `--env buildType` and `--env outputDir` with the same defaults.

### Running API tests

Full build needs to be performed before running API tests.

Additionally player binaries have to be installed:

```
> scripts\install\foobar2000.cmd v2.1-x64
```

or

```
$ scripts/install/deadbeef.sh v1.9
```

These commands download player distribution package and unpack it to `apps/<PLAYER>/<VERSION>`.

Now it is possible to run tests (in `js/api_tests` directory):
```
$ yarn test
```

This command supports various parameters via environment variables:

`BEEFWEB_TEST_BUILD_TYPE` - which build type to use (defaults to `Debug`)

`BEEFWEB_TEST_FOOBAR2000_VERSION` - foobar2000 version to use (defaults to `v2.1-x64`)

`BEEFWEB_TEST_DEADBEEF_VERSION` - DeaDBeeF version to use (defaults to `v1.9`)

These two variables could be useful if you don't want to use default directory layout `build/<BUILD_TYPE>`:

`BEEFWEB_BINARY_DIR` - CMake binary directory (defaults to `build/<BUILD_TYPE>`)

`BEEFWEB_BINARY_DIR_BASE` - parent of CMake binary directories for all build types (defaults to `build`)

When both are specified `BEEFWEB_BINARY_DIR` takes precedence.

If the specified path is not absolute it is resolved relative to source code root directory.

When building frontend these two variables could be used instead of `--env outputDir`.
