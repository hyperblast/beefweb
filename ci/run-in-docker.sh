if [ -z "$BUILD_TYPE" ]; then
    echo BUILD_TYPE is required
    exit 1
fi

if [ -z "$DOCKER_IMAGE" ]; then
    DOCKER_IMAGE=beefweb-dev:ubuntu-22.04
fi

if [ "$IN_DOCKER" == "1" ]; then
    cd "$(dirname $0)/.."
    main
else
    SCRIPT_PATH_ABS="$(realpath "$0")"
    cd "$(dirname $0)/.."
    SCRIPT_PATH_REL="$(realpath --relative-to="$(pwd)" "$SCRIPT_PATH_ABS")"

    docker run --rm \
        -e IN_DOCKER=1 -e BUILD_TYPE \
        -v "$(pwd):/work:z" \
        "$DOCKER_IMAGE" "/work/$SCRIPT_PATH_REL"
fi
