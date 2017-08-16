#include "content_type_map.hpp"

namespace msrv {

ContentTypeMap::ContentTypeMap()
    : defaultType_("application/octet-stream")
{
}

ContentTypeMap::~ContentTypeMap()
{
}

const std::string& ContentTypeMap::get(const Path& path) const
{
    auto iter = mapping_.find(path.extension().string());
    return iter != mapping_.end() ? iter->second : defaultType_;
}

void ContentTypeMap::add(const std::string& contentType, const std::string& ext)
{
    mapping_.emplace(pathFromUtf8("." + ext).string(), contentType);
}

void ContentTypeMap::add(const std::string& contentType, const std::string& ext, const std::string& ext2)
{
    add(contentType, ext);
    add(contentType, ext2);
}

void ContentTypeMap::addDefaults()
{
    add("text/html", "htm", "html");
    add("image/jpeg", "jpg", "jpeg");
    add("image/png", "png");
    add("image/gif", "gif");
    add("image/svg+xml", "svg");
    add("application/javascript", "js");
    add("text/css", "css");
}

}
