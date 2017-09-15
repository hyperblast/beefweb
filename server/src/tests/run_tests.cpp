#include "../log.hpp"

#define CATCH_CONFIG_RUNNER
#include "catch.hpp"

int main(int argc, char* argv[])
{
    msrv::StderrLogger logger(MSRV_PROJECT_ID);
    msrv::Logger::setCurrent(&logger);

    auto result = Catch::Session().run(argc, argv);
    return result ? EXIT_FAILURE : EXIT_SUCCESS;
}
