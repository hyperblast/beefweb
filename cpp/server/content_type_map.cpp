#include "content_type_map.hpp"
#include "http.hpp"
#include <stdlib.h>

namespace msrv {

namespace {

const uint8_t JPEG_HEADER[] = {0xFF, 0xD8, 0xFF};

const uint8_t PNG_HEADER[] = {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

const uint8_t GIF_HEADER[] = {0x47, 0x49, 0x46, 0x38};

const uint8_t BMP_HEADER[] = {0x42, 0x4D};

inline bool matchHeader(
    const std::vector<uint8_t>& fileData,
    const uint8_t* header,
    size_t size)
{
    return fileData.size() >= size
        && memcmp(fileData.data(), header, size) == 0;
}

}

ContentTypeMap::ContentTypeMap()
    : defaultType_(ContentType::APPLICATION_OCTET_STREAM),
      jpegType_(ContentType::IMAGE_JPEG),
      pngType_(ContentType::IMAGE_PNG),
      gifType_(ContentType::IMAGE_GIF),
      bmpType_(ContentType::IMAGE_BMP)
{
    add(ContentType::TEXT_HTML_UTF8, "htm", "html");
    add(ContentType::TEXT_PLAIN_UTF8, "txt");
    add(ContentType::TEXT_CSS, "css");
    add(ContentType::APPLICATION_JAVASCRIPT, "js");
    add(ContentType::APPLICATION_JSON, "json");
    add(ContentType::APPLICATION_WEB_MANIFEST, "webmanifest");
    add(ContentType::IMAGE_JPEG, "jpg", "jpeg");
    add(ContentType::IMAGE_PNG, "png");
    add(ContentType::IMAGE_GIF, "gif");
    add(ContentType::IMAGE_BMP, "bmp");
    add(ContentType::IMAGE_SVG, "svg");
}

ContentTypeMap::~ContentTypeMap() = default;

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
