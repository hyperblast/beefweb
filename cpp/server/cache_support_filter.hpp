#pragma once

#include "defines.hpp"
#include "request_filter.hpp"

#include <string>

namespace msrv {

class Response;
class FileResponse;

class CacheSupportFilter : public RequestFilter
{
public:
    CacheSupportFilter() = default;
    ~CacheSupportFilter() override = default;

    static void apply(Request* response);

protected:
    void endRequest(Request* request) override;

private:
    static std::string calculateETag(FileResponse* response);
    static void setCacheHeaders(Response* response, const std::string& etag);
};

}
