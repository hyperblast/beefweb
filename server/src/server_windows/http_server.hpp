#pragma once

#include "iocp.hpp"

namespace msrv {
namespace server_windows {

class HttpApiInit
{
public:
    explicit HttpApiInit(::ULONG flags);
    ~HttpApiInit();

private:
    ::ULONG flags_;

    MSRV_NO_COPY_AND_ASSIGN(HttpApiInit);
};

class HttpServer
{
public:
    HttpServer();
    ~HttpServer();

private:
    friend class HttpUrlBinding;

    WindowsHandle handle_;

    MSRV_NO_COPY_AND_ASSIGN(HttpServer);
};

class HttpUrlBinding
{
public:
    HttpUrlBinding(HttpServer* server, std::wstring prefix);
    ~HttpUrlBinding();

private:
    HttpServer* server_;
    std::wstring prefix_;

    MSRV_NO_COPY_AND_ASSIGN(HttpUrlBinding);
};

}}
