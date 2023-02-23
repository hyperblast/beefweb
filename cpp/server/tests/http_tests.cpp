#include "../http.hpp"

#include <catch.hpp>

namespace msrv::http_tests {

TEST_CASE("HttpKeyEqual")
{
    SECTION("works")
    {
        HttpKeyEqual equal;
        REQUIRE(equal("hello", "hello") == true);
        REQUIRE(equal("hello", "Hello") == true);
        REQUIRE(equal("hello", "hallo") == false);
        REQUIRE(equal("hello", "h") == false);
    }
}

TEST_CASE("HttpKeyHash")
{
    SECTION("works")
    {
        HttpKeyHash hash;
        REQUIRE(hash("hello") == hash("hello"));
        REQUIRE(hash("hello") == hash("Hello"));
        REQUIRE(hash("hello") != hash("hallo"));
        REQUIRE(hash("hello") != hash("h"));
    }
}

TEST_CASE("HttpKeyValueMap")
{
    SECTION("works")
    {
        HttpKeyValueMap map;

        map.emplace("test", "1");
        auto it = map.find("TEST");
        REQUIRE(it != map.end());
        REQUIRE(it->second == "1");

        map["Test"] = "2";
        it = map.find("TEST");
        REQUIRE(it != map.end());
        REQUIRE(it->second == "2");

        auto ret = map.try_emplace("tEst", "3");
        REQUIRE(ret.second == false);
    }
}

}
