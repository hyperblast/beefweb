#!/bin/bash

set -e

source "$(dirname $0)/config.sh"

usage="Usage: $(basename $0) options
Options:
  --debug           build in debug mode
  --release         build in release mode
  --server          build server
  --webui           build webui
  --pkg             build binary package
  --all             build server, webui and binary package
  --tests           also build corresponding tests
  --verbose         generate more debug messages
  -DKEY=VALUE       set cmake option when building server

Build mode option (--debug or --release) is required.
At least one build target (--server, --ui, --pkg or --all) is required.
"

build_type=
build_type_cmake=
has_targets=OFF
verbose=OFF
enable_server=OFF
enable_webui=OFF
enable_pkg=OFF
enable_tests=OFF
cmake_options=

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

        --debug)
            build_type=debug
            build_type_cmake=Debug
            ;;

        --release)
            build_type=release
            build_type_cmake=Release
            ;;

        --tests)
            enable_tests=ON
            ;;

        --verbose)
            verbose=ON
            ;;

        -D*)
            cmake_options="$cmake_options $arg"
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

server_src_dir=$(pwd)/server
server_build_dir=$(pwd)/server/build/$build_type
server_plugin_file=$server_build_dir/src/player_deadbeef/$plugin_file

webui_src_dir=$(pwd)/webui
webui_build_dir=$(pwd)/webui/build/$build_type

function banner()
{
    echo
    echo ">> $1 <<"
    echo
}

function detect_server_arch()
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

function show_server_build_logs()
{
    for log_file in extlibs-root/src/*-stamp/*.log; do
        echo "$log_file:"
        cat $log_file
        echo
    done
}

function build_server()
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

function build_webui()
{
    banner 'Building webui'

    webui_flags=""

    if [ "$build_type" = release ]; then
        webui_flags="$webui_flags --env.release"
    fi

    if [ "$enable_tests" = ON ]; then
        webui_flags="$webui_flags --env.tests"
    fi

    cd $webui_src_dir

    yarn install
    yarn run build $webui_flags
}

function build_pkg()
{
    banner 'Building package'

    detect_server_arch

    git_rev=$(git rev-parse --short HEAD)

    rm -rf $pkg_build_dir
    mkdir -p $pkg_tmp_dir/$webui_root

    cd $pkg_tmp_dir
    cp -v -t . $server_plugin_file
    cp -v -t $webui_root $webui_build_dir/*.*

    if [ "$build_type" = release ]; then
        echo "Stripping release binary: $plugin_file"
        strip -s $plugin_file
    fi

    tar czf $pkg_build_dir/${pkg_name}-${pkg_version}_${git_rev}-${server_arch}.tar.gz *

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
