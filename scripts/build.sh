#!/bin/bash

set -e

source "$(dirname $0)/config.sh"

usage="Usage: $(basename $0) options
Options:
  --debug           build in debug mode
  --release         build in release mode
  --relwithdebinfo  build in release-with-debug-info mode
  --minsizerel      build in minimal-size-release mode
  --server          build server
  --webui           build webui
  --pkg             build binary package
  --all             build server, webui and binary package
  --tests           also build corresponding tests
  --verbose         generate more debug messages
  -DKEY=VALUE       set cmake option when building server
  --env.option      set webui build option

Build type option (--debug or --release) is required.
At least one build target (--server, --ui, --pkg or --all) is required.
For web UI build types 'relwithdebinfo' and 'minsizerel' are aliases for 'release'
"

build_type=
build_type_cmake=
build_type_webui=
has_targets=OFF
verbose=OFF
enable_server=OFF
enable_webui=OFF
enable_pkg=OFF
enable_tests=OFF
cmake_options=
webui_flags=

for arg in "$@"; do
    case "$arg" in
        --server)
            has_targets=ON
            enable_server=ON
            ;;

        --webui)
            has_targets=ON
            enable_webui=ON
            ;;

        --pkg)
            has_targets=ON
            enable_pkg=ON
            ;;

        --all)
            has_targets=ON
            enable_server=ON
            enable_webui=ON
            enable_pkg=ON
            ;;

        --tests)
            enable_tests=ON
            ;;

        --debug)
            build_type=debug
            build_type_cmake=Debug
            build_type_webui=debug
            ;;

        --release)
            build_type=release
            build_type_cmake=Release
            build_type_webui=release
            ;;

        --relwithdebinfo)
            build_type=relwithdebinfo
            build_type_cmake=RelWithDebInfo
            build_type_webui=release
            ;;

        --minsizerel)
            build_type=minsizerel
            build_type_cmake=MinSizeRel
            build_type_webui=release
            ;;

        --verbose)
            verbose=ON
            ;;

        -D*)
            cmake_options="$cmake_options $arg"
            ;;

        --env.*)
            webui_flags="$webui_flags $arg"
            ;;

        --help)
            echo "$usage"
            exit 0
            ;;

        *)
            echo "invalid command line option: $arg"
            exit 1
    esac
done

if [ -z "$build_type" ] || [ "$has_targets" = OFF ]; then
    echo "$usage"
    exit 1
fi

cd "$(dirname $0)/.."

pkg_build_dir=$(pwd)/build/$build_type
pkg_tmp_dir=$pkg_build_dir/tmp
pkg_licenses_file=$project_name.licenses.tar.gz

server_src_dir=$(pwd)/server
server_build_dir=$server_src_dir/build/$build_type
server_plugin_file=$server_build_dir/src/deadbeef/$plugin_file

js_src_dir=$(pwd)/js
js_client_src_dir=$js_src_dir/client

webui_src_dir=$js_src_dir/webui
webui_build_dir=$webui_src_dir/build/$build_type_webui

function banner
{
    echo
    echo ">> $1 <<"
    echo
}

function detect_server_arch
{
    test -e $server_plugin_file
    server_plugin_info=$(file $server_plugin_file)

    if echo $server_plugin_info | grep 'Intel 80386' > /dev/null; then
        server_arch=x86
    elif echo $server_plugin_info | grep 'x86-64' > /dev/null; then
        server_arch=x86_64
    else
        server_arch=unknown
    fi
}

function show_server_build_logs
{
    for log_file in extlibs-root/src/*-stamp/*.log; do
        echo "$log_file:"
        cat $log_file
        echo
    done
}

function build_server
{
    banner 'Building server'

    rm -rf $server_build_dir
    mkdir -p $server_build_dir
    cd $server_build_dir

    cmake \
        -DCMAKE_BUILD_TYPE=$build_type_cmake \
        -DENABLE_TESTS=$enable_tests \
        $cmake_options \
        $server_src_dir

    if ! cmake --build . ; then
        if [ "$verbose" = ON ]; then
            show_server_build_logs
        fi

        exit 1
    fi
}

function build_webui
{
    banner 'Building webui'

    if [ "$build_type_webui" = release ]; then
        webui_flags="$webui_flags --env.release"
    fi

    if [ "$enable_tests" = ON ]; then
        webui_flags="$webui_flags --env.tests"
    fi

    cd $js_src_dir
    yarn install

    cd $js_client_src_dir
    yarn build

    cd $webui_src_dir
    yarn build $webui_flags
}

function build_pkg()
{
    banner 'Building package'

    if [ "$pkg_version_final" -ne 0 ]; then
        git_rev_suffix=""
    else
        git_rev_suffix="_$(git rev-parse --short HEAD)"
    fi

    detect_server_arch

    rm -rf $pkg_build_dir
    mkdir -p $pkg_tmp_dir/$webui_root

    cd $pkg_tmp_dir

    cp -v -t . $server_plugin_file
    cp -v -t . $server_src_dir/extlibs/server-licenses.txt

    cp -v -t $webui_root $webui_build_dir/*.*
    (cd $webui_src_dir; yarn licenses generate-disclaimer | grep -v '^info ') > webui-licenses.txt

    tar cfa $pkg_licenses_file *-licenses.txt

    case "$build_type" in
        release|minsizerel)
            echo "Stripping release binary: $plugin_file"
            strip -s $plugin_file
            ;;

        relwithdebinfo)
            echo "Extracting debug info from binary: $plugin_file"
            objcopy --only-keep-debug "$plugin_file" "$plugin_file.debug"
            strip -s "$plugin_file"
            objcopy --add-gnu-debuglink="$plugin_file.debug" "$plugin_file"
            ;;
    esac

    pkg_full_name=${pkg_name}-${pkg_version}${git_rev_suffix}-${server_arch}

    tar cfa $pkg_build_dir/$pkg_full_name.tar.gz \
        $plugin_file $webui_root $pkg_licenses_file

    if [ "$build_type" = relwithdebinfo ]; then
        tar cfa $pkg_build_dir/$pkg_full_name.debug.tar.xz $plugin_file.debug
    fi

    rm -rf $pkg_tmp_dir
}

if [ "$enable_webui" = ON ]; then
    build_webui
fi

if [ "$enable_server" = ON ]; then
    build_server
fi

if [ "$enable_pkg" = ON ]; then
    build_pkg
fi
