#include "../log.hpp"
#include "../project_info.hpp"

#ifdef MSRV_OS_POSIX
#include "../charset.hpp"
#include <locale.h>
#endif

#define CATCH_CONFIG_RUNNER
#include "catch.hpp"

namespace {

void initLocale()
{
#ifdef MSRV_OS_POSIX
    ::setlocale(LC_ALL, "");
    ::setlocale(LC_NUMERIC, "C");
    msrv::setLocaleCharset();
#endif
}

}

int main(int argc, char* argv[])
{
    msrv::StderrLogger logger(MSRV_PROJECT_ID);
    msrv::Logger::setCurrent(&logger);

    initLocale();

    auto result = Catch::Session().run(argc, argv);
    return result ? EXIT_FAILURE : EXIT_SUCCESS;
}
