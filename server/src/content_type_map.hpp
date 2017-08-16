#pragma once

#include "defines.hpp"
#include "unordered_map"
#include "file_system.hpp"

namespace msrv {

class ContentTypeMap
{
public:
    ContentTypeMap();
    ~ContentTypeMap();

    const std::string& get(const Path& path) const;
    void add(const std::string& contentType, const std::string& ext);
    void add(const std::string& contentType, const std::string& ext, const std::string& ext2);
    void addDefaults();

private:
    std::string defaultType_;
    std::unordered_map<Path::string_type, std::string> mapping_;
};

}
