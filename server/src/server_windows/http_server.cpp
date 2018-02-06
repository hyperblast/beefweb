#include "http_server.hpp"
#include <http.h>

namespace msrv {
namespace server_windows {

HttpApiInit::HttpApiInit(::ULONG flags)
    : flags_(0)
{
    ::HTTPAPI_VERSION version = HTTPAPI_VERSION_1;
    auto ret = ::HttpInitialize(version, flags, nullptr);
    throwIfFailed("HttpInitialize", ret == NO_ERROR, ret);
    flags_ = flags;
}

HttpApiInit::~HttpApiInit()
{
    if (flags_ != 0)
        ::HttpTerminate(flags_, nullptr);
}

HttpServer::HttpServer()
{
    HANDLE handle;
    auto ret = ::HttpCreateHttpHandle(&handle, 0);
    throwIfFailed("HttpCreateHttpHandle", ret == NO_ERROR, ret);
    handle_.reset(handle);
}

HttpServer::~HttpServer() = default;

HttpUrlBinding::HttpUrlBinding(HttpServer* server, std::wstring prefix)
    : server_(nullptr), prefix_(std::move(prefix))
{
    auto ret = ::HttpAddUrl(server->handle_.get(), prefix_.c_str(), nullptr);
    throwIfFailed("HttpAddUrl", ret == NO_ERROR, ret);
    server_ = server;
}

HttpUrlBinding::~HttpUrlBinding()
{
    if (server_)
        ::HttpRemoveUrl(server_->handle_.get(), prefix_.c_str());
}

}}
