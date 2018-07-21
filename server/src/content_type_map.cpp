#include "content_type_map.hpp"
#include <stdlib.h>

namespace msrv {

namespace {

const uint8_t JPEG_HEADER[] = { 0xFF,0xD8, 0xFF };
const uint8_t PNG_HEADER[] = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
const uint8_t GIF_HEADER[] = { 0x47, 0x49, 0x46, 0x38 };
const uint8_t BMP_HEADER[] = { 0x42, 0x4D };

inline bool matchHeader(
    const std::vector<uint8_t> fileData,
    const uint8_t* header, size_t size)
{
    return fileData.size() >= size
        && memcmp(fileData.data(), header, size) == 0;
}

}

ContentTypeMap::ContentTypeMap()
    : defaultType_("application/octet-stream"),
      jpegType_("image/jpeg"),
      pngType_("image/png"),
      gifType_("image/gif"),
      bmpType_("image/bmp")
{
    add("text/html", "htm", "html");
    add("image/jpeg", "jpg", "jpeg");
    add("image/png", "png");
    add("image/gif", "gif");
    add("image/bmp", "bmp");
    add("image/svg+xml", "svg");
    add("application/javascript", "js");
    add("text/css", "css");
    add("text/plain", "txt");
}

ContentTypeMap::~ContentTypeMap()
{
}

const std::string& ContentTypeMap::byFilePath(const Path& path) const
{
    auto iter = mapping_.find(path.extension().native());
    return iter != mapping_.end() ? iter->second : defaultType_;
}

const std::string& ContentTypeMap::byHeader(const std::vector<uint8_t>& header) const
{
    if (matchHeader(header, JPEG_HEADER, sizeof(JPEG_HEADER)))
        return jpegType_;

    if (matchHeader(header, PNG_HEADER, sizeof(PNG_HEADER)))
        return pngType_;

    if (matchHeader(header, GIF_HEADER, sizeof(GIF_HEADER)))
        return gifType_;

    if (matchHeader(header, BMP_HEADER, sizeof(BMP_HEADER)))
        return bmpType_;

    return defaultType_;
}

void ContentTypeMap::add(const std::string& contentType, const std::string& ext)
{
    mapping_.emplace(pathFromUtf8("." + ext).native(), contentType);
}

void ContentTypeMap::add(const std::string& contentType, const std::string& ext, const std::string& ext2)
{
    add(contentType, ext);
    add(contentType, ext2);
}

}
