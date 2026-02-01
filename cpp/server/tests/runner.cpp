#include "test_main.hpp"

#define CATCH_CONFIG_RUNNER
#include <catch2/catch.hpp>

namespace msrv {

int testMain(int argc, char** argv)
{
    auto result = Catch::Session().run(argc, argv);
    return result ? EXIT_FAILURE : EXIT_SUCCESS;
}

}
