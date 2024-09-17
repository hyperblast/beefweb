#pragma once

#include "defines.hpp"
#include "request_filter.hpp"
#include "response.hpp"

#include <string>

namespace msrv {

class Response;

class FileResponse;

class CacheSupportFilter : public RequestFilter
{
public:
    CacheSupportFilter() = default;
    ~CacheSupportFilter() override = default;

protected:
    void endRequest(Request* request) override;

private:
    static std::string getEtag(Response* response);
    static uint64_t getHash(DataResponse* response);
    static uint64_t getHash(FileResponse* response);
    static std::string formatHash(uint64_t hash);
    static void setCacheHeaders(Response* response, const std::string& etag);
};

}
