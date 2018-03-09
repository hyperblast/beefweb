#pragma once

#define DDB_API_LEVEL 8
#define DDB_WARN_DEPRECATED 1

#include <deadbeef/deadbeef.h>
#include <deadbeef/artwork.h>

#if (DB_API_VERSION_MAJOR != 1) || (DB_API_VERSION_MINOR < 8)
#error DB_API_VERSION should be at least 1.8
#endif

namespace msrv {
namespace player_deadbeef {

extern DB_functions_t* ddbApi;

}}
