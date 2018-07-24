#pragma once

#include "server_core.hpp"
#include "beast.hpp"

namespace msrv {

class BeastRequest : public RequestCore
{
public:
    BeastRequest();
    ~BeastRequest();
};

}
