#include "../base64.hpp"

#include <catch.hpp>

namespace msrv {
namespace base64_tests {

TEST_CASE("base64")
{
    REQUIRE(base64Decode("Cg==") == "\n");
    REQUIRE(base64Decode("WU4=") == "YN");
    REQUIRE(base64Decode("SGVsbG8gV29ybGQh") == "Hello World!");
    REQUIRE(base64Decode("abcd123,") == "");
}

}
}
