#include "artwork_request.hpp"
#include "../log.hpp"

namespace msrv {
namespace player_deadbeef {

ArtworkRequest::~ArtworkRequest() = default;

boost::unique_future<ArtworkResult> ArtworkRequest::execute()
{
    logDebug("artwork query: artist = %s; album = %s; filePath = %s",
        artist_.c_str(), album_.c_str(), filePath_.c_str());

    Path filePath = pathFromUtf8(filePath_);
    auto filePathAsString = !filePath.empty() ? filePath.c_str() : nullptr;
    auto artist = !artist_.empty() ? artist_.c_str() : nullptr;
    auto album = !album_.empty() ? album_.c_str() : nullptr;

    char resultPath[PATH_MAX];

    plugin_->make_cache_path2(
        resultPath, sizeof(resultPath), filePathAsString, album, artist, -1);

    resultPath_ = pathToUtf8(Path(resultPath));

    logDebug("artwork result path: %s", resultPath_.c_str());

    intrusive_ptr_add_ref(this);

    MallocPtr<char> cachedResultPath(
        plugin_->get_album_art(filePathAsString, artist, album, -1, callback, this));

    if (cachedResultPath)
    {
        intrusive_ptr_release(this);

        logDebug("artwork found in cache: %s", cachedResultPath.get());
        promise_.set_value(ArtworkResult(std::string(cachedResultPath.get())));
    }

    return promise_.get_future();
}

void ArtworkRequest::complete(const char* filePath, const char* artist, const char* album)
{
    if (filePath || artist || album)
    {
        logDebug(
            "artwork found: artist = %s; album = %s; filePath = %s",
            artist ? artist : "",
            album ? album : "",
            filePath ? filePath : "");

        promise_.set_value(ArtworkResult(resultPath_));
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
