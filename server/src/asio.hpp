#pragma once

#include <boost/asio.hpp>

#ifdef MSRV_OS_WINDOWS
#include "safe_windows.h"
#endif

namespace msrv { namespace asio = boost::asio; }
