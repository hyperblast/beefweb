#include "../parsing.hpp"

#include <catch.hpp>

namespace msrv {
namespace base64_tests {

TEST_CASE("parsing")
{
    SECTION("parse int32")
    {
        int32_t result;
        REQUIRE(parseValue<int32_t>("123") == 123);
        REQUIRE(!tryParseValue<int32_t>("123t", &result));
    }

    SECTION("parse bool")
    {
        bool result;
        REQUIRE(parseValue<bool>("true"));
        REQUIRE(!parseValue<bool>("false"));
        REQUIRE(!tryParseValue<bool>("fail", &result));
    }

    SECTION("parse string list")
    {
        std::vector<std::string> actual;
        std::vector<std::string> expected;

        // strict parsing: everything is preserved with regards to escaping rules
        actual = parseValue<std::vector<std::string>>("\\\\hello\\, world,!");
        expected = std::vector<std::string>({ "\\hello, world", "!" });
        REQUIRE(actual == expected);

        // non strict parsing: entries are trimmed and empty ones are discarded
        actual = parseValueList<std::string>("hello; world; ;;", ';');
        expected = std::vector<std::string>({ "hello", "world" });
        REQUIRE(actual == expected);
    }
}

}}
