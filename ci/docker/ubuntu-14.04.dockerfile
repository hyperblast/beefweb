FROM ubuntu:14.04

ARG DEBIAN_FRONTEND=noninteractive

COPY ./install.sh \
     ./install-cmake.sh \
     ./install-node.sh \
     /scripts/

COPY ./site-config.jam /etc/

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        tzdata software-properties-common libasound2 build-essential file curl git zlib1g-dev && \
    add-apt-repository -y ppa:ubuntu-toolchain-r/test && \
    apt-get update && \
    apt-get install -y gcc-9 g++-9 && \
    /scripts/install-cmake.sh && \
    /scripts/install-node.sh

ENV CC=gcc-9
ENV CXX=g++-9

CMD ["/bin/bash"]
