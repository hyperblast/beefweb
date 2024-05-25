#include "artwork_fetcher.hpp"
#include "../file_system.hpp"
#include "../log.hpp"

#include <deadbeef/artwork-legacy.h>

namespace msrv {
namespace player_deadbeef {

class ArtworkRequestV1
    : public boost::intrusive_ref_counter<ArtworkRequestV1, boost::thread_safe_counter>
{
public:
    static boost::intrusive_ptr<ArtworkRequestV1> create(
        DB_artwork_plugin_t* artworkPlugin,
        std::string artist,
        std::string album,
        std::string filePath)
    {
        return {
            new ArtworkRequestV1(
                artworkPlugin,
                std::move(artist),
                std::move(album),
                std::move(filePath))};
    }

    ~ArtworkRequestV1() = default;

    boost::unique_future<ArtworkResult> execute();

private:
    ArtworkRequestV1(
        DB_artwork_plugin_t* plugin,
        std::string artist,
        std::string album,
        std::string filePath)
        : plugin_(plugin),
          artist_(std::move(artist)),
          album_(std::move(album)),
          filePath_(std::move(filePath)) { }

    static void callback(const char* filePath, const char* artist, const char* album, void* data);

    void complete(const char* filePath, const char* artist, const char* album);

    DB_artwork_plugin_t* plugin_;
    std::string artist_;
    std::string album_;
    std::string filePath_;
    std::string resultPath_;
    boost::promise<ArtworkResult> promise_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkRequestV1);
};

boost::unique_future<ArtworkResult> ArtworkRequestV1::execute()
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

void ArtworkRequestV1::complete(const char* filePath, const char* artist, const char* album)
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

void ArtworkRequestV1::callback(
    const char* filePath, const char* artist, const char* album, void* data)
{
    boost::intrusive_ptr<ArtworkRequestV1> request(reinterpret_cast<ArtworkRequestV1*>(data), false);

    tryCatchLog([&] { request->complete(filePath, artist, album); });
}

class ArtworkFetcherV1 : public ArtworkFetcher
{
public:
    explicit ArtworkFetcherV1(DB_artwork_plugin_t* plugin) : plugin_(plugin) {  }

    ~ArtworkFetcherV1() override { plugin_->reset(0); }

    boost::unique_future<ArtworkResult> fetchArtwork(
        std::string artist, std::string album, std::string filePath) override;

private:
    DB_artwork_plugin_t* plugin_;
};

std::unique_ptr<ArtworkFetcher> ArtworkFetcher::createV1()
{
    auto artwork = ddbApi->plug_get_for_id("artwork");

    if (artwork && PLUG_TEST_COMPAT(artwork, 1, DDB_ARTWORK_VERSION))
        return std::make_unique<ArtworkFetcherV1>(reinterpret_cast<DB_artwork_plugin_t*>(artwork));

    return {};
}

boost::unique_future<ArtworkResult> ArtworkFetcherV1::fetchArtwork(
    std::string artist, std::string album, std::string filePath)
{
    return ArtworkRequestV1::create(plugin_, artist, album, filePath)->execute();
}

}}
