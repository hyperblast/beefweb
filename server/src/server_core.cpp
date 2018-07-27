#include "server_core.hpp"
#include "log.hpp"

namespace msrv {

namespace {

bool shouldUseBeast()
{
    auto env = getenv("BEEFWEB_USE_BEAST");
    auto result = env ? strcmp(env, "0") != 0 : MSRV_DEBUG_MODE;
    logInfo("using %s backend", result ? "beast" : "standard");
    return result;
}

}

ServerCore::~ServerCore() = default;

ServerCorePtr ServerCore::create()
{
    static bool useBeast = shouldUseBeast();
    return useBeast ? createBeast() : createStandard();
}

}
