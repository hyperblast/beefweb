#ifdef MSRV_OS_POSIX
#include "../charset.hpp"
#include <locale.h>
#endif

#ifdef MSRV_OS_WINDOWS
#include "../safe_windows.h"
#endif

#include "../log.hpp"
#include "../project_info.hpp"

int testMain(int argc, char* argv[]);

int main(int argc, char* argv[])
{
    msrv::StderrLogger logger(MSRV_PROJECT_ID);
    msrv::Logger::setCurrent(&logger);

#ifdef MSRV_OS_POSIX
    ::setlocale(LC_ALL, "");
    ::setlocale(LC_NUMERIC, "C");
    msrv::setLocaleCharset();
#endif

    return testMain(argc, argv);
}
