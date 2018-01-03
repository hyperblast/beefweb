#pragma once

#define MSRV_FORMAT_FUNC(fmt, args) \
    __attribute__((format(printf, fmt, args)))

#define MSRV_NO_COPY_AND_ASSIGN(type) \
    type(const type&) = delete; \
    type& operator=(const type&) = delete
