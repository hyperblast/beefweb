set(LIBEVENT_INCLUDE_DIRS ${DEPS_INSTALL_DIR}/include)

set(
    LIBEVENT_LIBRARIES
    ${DEPS_INSTALL_DIR}/lib/libevent.a
    ${DEPS_INSTALL_DIR}/lib/libevent_pthreads.a
)
