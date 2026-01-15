#ifdef MSRV_OS_POSIX
#include "charset.hpp"
#include <locale.h>

#endif

#ifdef MSRV_OS_WINDOWS
#include "../safe_windows.h"
#endif

#include "../log.hpp"
#include "project_info.hpp"

namespace msrv { int testMain(int argc, char** argv); }

int main(int argc, char* argv[])
{
    using namespace msrv;

    StderrLogger logger;
    LoggerScope loggerScope(&logger);

#ifdef MSRV_OS_POSIX
    ::setlocale(LC_ALL, "");
    ::setlocale(LC_NUMERIC, "C");
    setLocaleCharset();
#endif

    return testMain(argc, argv);
}
