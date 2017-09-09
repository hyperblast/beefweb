#include <stddef.h>
#include <stdint.h>
#include <type_traits>

namespace msrv {

// 64-bit Fowler/Noll/Vo FNV-1a hash
// Based on public domain code from:
// http://www.isthe.com/chongo/tech/comp/fnv/

class FnvHash
{
public:
    FnvHash() : value_(INIT) { }

    void addBytes(const void* buffer, size_t size)
    {
        const uint8_t* pos = reinterpret_cast<const uint8_t*>(buffer);
        const uint8_t* end = pos + size;
        uint64_t value = value_;

        while (pos < end)
        {
            // xor the bottom with the current octet
            value ^= *pos++;

            // multiply by the 64 bit FNV magic prime mod 2^64
            value *= PRIME;
        }
        
        value_ = value;
    }

    template<typename T>
    void addValue(T value)
    {
        static_assert(std::is_fundamental<T>(), "fundamental type required");
        addBytes(&value, sizeof(T));
    }

    uint64_t value() const { return value_; }

private:
    const uint64_t INIT = UINT64_C(0xcbf29ce484222325);
    const uint64_t PRIME = UINT64_C(0x100000001b3);
    
    uint64_t value_;
};

}
