#include "server.hpp"

namespace msrv {

Server::Server() = default;

Server::~Server()
{
    destroyed_.set_value();
}

}
