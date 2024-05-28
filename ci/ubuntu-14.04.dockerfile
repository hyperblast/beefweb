FROM ubuntu:14.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        tzdata software-properties-common build-essential file curl git zlib1g-dev && \
    add-apt-repository -y ppa:ubuntu-toolchain-r/test && \
    apt-get update && \
    apt-get install -y gcc-9 g++-9

ENV CC=gcc-9
ENV CXX=g++-9

CMD ["/bin/bash"]
