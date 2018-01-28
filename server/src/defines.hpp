#pragma once

#if defined(__GNUC__) || defined(__clang__)
#define MSRV_FORMAT_FUNC(fmt, args) \
    __attribute__((format(printf, fmt, args)))
#else
#define MSRV_FORMAT_FUNC(fmt, args)
#endif

#define MSRV_NO_COPY_AND_ASSIGN(type) \
    type(const type&) = delete; \
    type& operator=(const type&) = delete
