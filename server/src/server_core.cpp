#include "server_core.hpp"

namespace msrv {

ServerCore::~ServerCore() = default;

ServerCorePtr ServerCore::create(ServerBackend backend)
{
    switch (backend)
    {
    case ServerBackend::STANDARD:
        return createStandard();

    case ServerBackend::BEAST:
        return createBeast();

    default:
        return ServerCorePtr();
    }
}

}
