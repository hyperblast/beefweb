FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        tzdata build-essential file curl git cmake nodejs yarnpkg zlib1g-dev

RUN cd /usr/bin && ln -s yarnpkg yarn

RUN git config --global --add safe.directory /work

CMD ["/bin/bash"]
