#pragma once

#include "defines.hpp"
#include "request_filter.hpp"

namespace msrv {

class FileResponse;

class CacheSupportFilter : public RequestFilter
{
public:
    CacheSupportFilter();
    virtual ~CacheSupportFilter();

protected:
    virtual void endRequest(Request* request) override;

private:
    std::string calculateETag(FileResponse* response);
};

}
