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

#define MSRV_ENUM_FLAGS(Type, Base) \
    inline bool hasFlags(Type target, Type flags) \
    { return (static_cast<Base>(target) & static_cast<Base>(flags)) == static_cast<Base>(flags); } \
    inline Type setFlags(Type current, Type flags, bool set) \
    { \
        return static_cast<Type>(set \
            ? (static_cast<Base>(current) | static_cast<Base>(flags)) \
            : (static_cast<Base>(current) & ~static_cast<Base>(flags))); \
    } \
    inline Type operator|(Type first, Type second) \
    { return static_cast<Type>(static_cast<Base>(first) | static_cast<Base>(second)); } \
    \
    inline Type operator|=(Type& first, Type second) \
    { return (first = static_cast<Type>(static_cast<Base>(first) | static_cast<Base>(second))); } \
    \
    inline Type operator&(Type first, Type second) \
    { return static_cast<Type>(static_cast<Base>(first) & static_cast<Base>(second)); } \
    \
    inline Type operator&=(Type& first, Type second) \
    { return (first = static_cast<Type>(static_cast<Base>(first) & static_cast<Base>(second))); }
