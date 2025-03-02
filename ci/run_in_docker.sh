if [ -z "$BUILD_TYPE" ]; then
    echo BUILD_TYPE is required
    exit 1
fi

if [ "$IN_DOCKER" == "1" ]; then
    cd "$(dirname $0)/.."
    main
    exit 0
fi

if [ -z "$DOCKER_IMAGE" ]; then
    echo DOCKER_IMAGE is required
    exit 1
fi

SCRIPT_PATH_ABS="$(realpath "$0")"
cd "$(dirname $0)/.."
SCRIPT_PATH_REL="$(realpath --relative-to="$(pwd)" "$SCRIPT_PATH_ABS")"

docker run --rm \
    -e IN_DOCKER=1 -e BUILD_TYPE \
    -v "$(pwd):/work:z" \
    "beefweb-dev:$DOCKER_IMAGE" "/work/$SCRIPT_PATH_REL"
