FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        tzdata libasound2 build-essential file curl git cmake nodejs yarnpkg zlib1g-dev && \
    ln -s /usr/bin/yarnpkg /usr/bin/yarn && \
    git config --global --add safe.directory /work

CMD ["/bin/bash"]
