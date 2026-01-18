#include "fnv_hash.hpp"

#include <catch.hpp>

namespace msrv {
namespace fnv_hash_tests {

TEST_CASE("fnv_hash")
{
    SECTION("addBytes")
    {
        FnvHash hash;
        const char input[] = "Hello World";
        hash.addBytes(input, sizeof(input) - 1);
        REQUIRE(hash.value() == UINT64_C(0x3d58dee72d4e0c27));
    }

    SECTION("multiple addBytes")
    {
        FnvHash hash;
        const char input1[] = "FNV ";
        const char input2[] = "Rocks";
        const char input3[] = "!";
        hash.addBytes(input1, sizeof(input1) - 1);
        hash.addBytes(input2, sizeof(input2) - 1);
        hash.addBytes(input3, sizeof(input3) - 1);
        REQUIRE(hash.value() == UINT64_C(0x738fbfb6ba6bdac6));
    }

    SECTION("addValue")
    {
        FnvHash hash;
        hash.addValue(UINT32_C(0x58585858));
        REQUIRE(hash.value() == UINT64_C(0xf1c9d95c7cd69f75));
    }
}

}
}
