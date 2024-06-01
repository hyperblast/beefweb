#!/bin/bash

set -e

source "$(dirname $0)/config.sh"

usage="Usage: $(basename $0) options
Options:
  --debug           build in debug mode
  --release         build in release mode
  --relwithdebinfo  build in release-with-debug-info mode
  --minsizerel      build in minimal-size-release mode
  --plugin          build plugin
  --pkg             build binary package
  --all             build plugin and binary package
  --tests           also build corresponding tests
  --verbose         generate more debug messages
  -DKEY=VALUE       set cmake option

Build type option (--debug or --release) is required.
At least one build target (--plugin, --pkg, or --all) is required.
"

build_type=
has_targets=OFF
verbose=OFF
enable_plugin=OFF
enable_pkg=OFF
enable_tests=OFF
cmake_options=

for arg in "$@"; do
    case "$arg" in
        --plugin)
            has_targets=ON
            enable_plugin=ON
            ;;

        --pkg)
            has_targets=ON
            enable_pkg=ON
            ;;

        --all)
            has_targets=ON
            enable_plugin=ON
            enable_pkg=ON
            ;;

        --tests)
            enable_tests=ON
            ;;

        --debug)
            build_type=Debug
            ;;

        --release)
            build_type=Release
            ;;

        --relwithdebinfo)
            build_type=RelWithDebInfo
            ;;

        --minsizerel)
            build_type=MinSizeRel
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

source_dir="$(pwd)"
build_dir="$(pwd)/build/$build_type"
server_plugin_file="$build_dir/cpp/server/deadbeef/$plugin_file"
webui_build_dir="$build_dir/js/webui/output"

pkg_build_dir="$(pwd)/build/$build_type.pkg"
pkg_tmp_dir="$pkg_build_dir/tmp"
pkg_licenses_file="$project_name.licenses.tar.gz"

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

function show_build_logs
{
    for log_file in cpp/extlibs-root/src/*-stamp/*.log; do
        echo "$log_file:"
        cat $log_file
        echo
    done
}

function build_plugin
{
    banner 'Building plugin'

    rm -rf "$build_dir"
    mkdir -p "$build_dir"
    cd "$build_dir"

    cmake \
        -DCMAKE_BUILD_TYPE=$build_type \
        -DENABLE_TESTS=$enable_tests \
        $cmake_options \
        "$source_dir"

    if ! cmake --build . -j $(nproc) ; then
        if [ "$verbose" = ON ]; then
            show_build_logs
        fi

        exit 1
    fi
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

    rm -rf "$pkg_build_dir"
    mkdir -p "$pkg_tmp_dir/$webui_root"

    cd "$pkg_tmp_dir"

    cp -v -t . "$server_plugin_file"
    cp -v -t . "$source_dir/cpp/extlibs/server-licenses.txt"

    cp -v -t $webui_root $webui_build_dir/*.*
    (
        cd "$source_dir/js/webui";
        yarn licenses generate-disclaimer \
            --ignore-engines --ignore-platform --prod | grep -v '^info '
    ) > webui-licenses.txt

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

if [ "$enable_plugin" = ON ]; then
    build_plugin
fi

if [ "$enable_pkg" = ON ]; then
    build_pkg
fi
