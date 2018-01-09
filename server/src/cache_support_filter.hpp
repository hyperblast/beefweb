#pragma once

#include "defines.hpp"
#include "request_filter.hpp"

namespace msrv {

class Response;
class FileResponse;

class CacheSupportFilter : public RequestFilter
{
public:
    CacheSupportFilter();
    virtual ~CacheSupportFilter();

protected:
    virtual void endRequest(Request* request) override;

private:
    static std::string calculateETag(FileResponse* response);

    void setCacheHeaders(Response* reponse, const std::string& etag);
};

}
