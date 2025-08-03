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

    const std::string& byFilePath(const Path& path) const;
    const std::string& byHeader(const std::vector<uint8_t>& header) const;

    void add(const std::string& contentType, const std::string& ext);
    void add(const std::string& contentType, const std::string& ext, const std::string& ext2);

private:
    std::unordered_map<Path::string_type, std::string> mapping_;
    std::string defaultType_;
    std::string jpegType_;
    std::string pngType_;
    std::string gifType_;
    std::string bmpType_;
    std::string webpType_;
};

}
