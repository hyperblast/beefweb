#include "artwork_request.hpp"
#include "../log.hpp"

namespace msrv {
namespace plugin_deadbeef {

ArtworkRequest::ArtworkRequest(DB_artwork_plugin_t* plugin)
    : plugin_(plugin)
{
}

ArtworkRequest::~ArtworkRequest()
{
}

boost::unique_future<ArtworkResult> ArtworkRequest::execute(const ArtworkQuery& query)
{
    logDebug("artwork query: file = %s; artist = %s; album = %s",
             query.file.c_str(), query.artist.c_str(), query.album.c_str());

    Path sourcePath = pathFromUtf8(query.file);
    auto sourcePathStr = !sourcePath.empty() ? sourcePath.c_str() : nullptr;
    auto artist = !query.artist.empty() ? query.artist.c_str() : nullptr;
    auto album = !query.album.empty() ? query.album.c_str() : nullptr;

    char cachePath[PATH_MAX];

    plugin_->make_cache_path2(
        cachePath, sizeof(cachePath), sourcePathStr, album, artist, -1);

    cachePath_ = pathToUtf8(Path(cachePath));

    logDebug("artwork cached path: %s", cachePath_.c_str());

    intrusive_ptr_add_ref(this);

    MallocPtr<char> artworkPath(
        plugin_->get_album_art(sourcePathStr, artist, album, -1, callback, this));

    if (artworkPath)
    {
        intrusive_ptr_release(this);

        logDebug("artwork found in cache: %s", artworkPath.get());
        promise_.set_value(ArtworkResult(std::string(artworkPath.get())));
    }

    return promise_.get_future();
}

void ArtworkRequest::complete(const char* fileName, const char* artist, const char* album)
{
    if (fileName || artist || album)
    {
        logDebug(
            "artwork found: file = %s; artist = %s; album = %s",
            fileName ? fileName : "",
            artist ? artist : "",
            album ? album : "");

        promise_.set_value(ArtworkResult(cachePath_));
    }
    else
    {
        logDebug("artwork is not found");
        promise_.set_value(ArtworkResult());
    }
}

void ArtworkRequest::callback(
    const char* fileName, const char* artist, const char* album, void* data)
{
    boost::intrusive_ptr<ArtworkRequest> request(reinterpret_cast<ArtworkRequest*>(data), false);

    tryCatchLog([&] { request->complete(fileName, artist, album); });
}

}}
