#include "artwork_fetcher.hpp"
#include "../file_system.hpp"
#include "../log.hpp"
#include "utils.hpp"

#include <deadbeef/artwork-legacy.h>

#include <utility>

namespace msrv {
namespace player_deadbeef {

namespace {

class ArtworkRequestV1
    : public boost::intrusive_ref_counter<ArtworkRequestV1, boost::thread_safe_counter>
{
public:
    ArtworkRequestV1(
        DB_artwork_plugin_t* plugin,
        std::string filePath,
        std::string artist,
        std::string album)
        : plugin_(plugin),
          filePath_(std::move(filePath)),
          artist_(std::move(artist)),
          album_(std::move(album)) { }

    ~ArtworkRequestV1() = default;

    boost::unique_future<ArtworkResult> execute();

private:
    static void callback(const char* filePath, const char* artist, const char* album, void* data);

    void complete(const char* filePath, const char* artist, const char* album);

    DB_artwork_plugin_t* plugin_;
    std::string filePath_;
    std::string artist_;
    std::string album_;
    std::string resultPath_;
    boost::promise<ArtworkResult> resultPromise_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkRequestV1);
};

boost::unique_future<ArtworkResult> ArtworkRequestV1::execute()
{
    logDebug(
        "artwork query: filePath = %s; artist = %s; album = %s",
         filePath_.c_str(), artist_.c_str(), album_.c_str());

    auto filePath = filePath_.empty() ? nullptr : filePath_.c_str();
    auto artist = artist_.empty() ? nullptr : artist_.c_str();
    auto album = album_.empty() ? nullptr : album_.c_str();

    char resultPath[PATH_MAX];
    plugin_->make_cache_path2(resultPath, sizeof(resultPath), filePath, album, artist, -1);
    resultPath_ = pathToUtf8(Path(resultPath));
    logDebug("artwork result path: %s", resultPath_.c_str());

    intrusive_ptr_add_ref(this);
    MallocPtr<char> cachedResultPath(plugin_->get_album_art(filePath, artist, album, -1, callback, this));

    if (cachedResultPath)
    {
        intrusive_ptr_release(this);
        logDebug("artwork found in cache: %s", cachedResultPath.get());
        resultPromise_.set_value(ArtworkResult(std::string(cachedResultPath.get())));
    }

    return resultPromise_.get_future();
}

void ArtworkRequestV1::complete(const char* filePath, const char* artist, const char* album)
{
    if (filePath || artist || album)
    {
        logDebug(
            "artwork found: filePath = %s; artist = %s; album = %s",
            filePath ? filePath : "",
            artist ? artist : "",
            album ? album : "");

        resultPromise_.set_value(ArtworkResult(resultPath_));
    }
    else
    {
        logDebug("artwork is not found");
        resultPromise_.set_value(ArtworkResult());
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
    explicit ArtworkFetcherV1(DB_artwork_plugin_t* plugin, std::vector<TitleFormatPtr> columns)
        : plugin_(plugin), columns_(std::move(columns)) {  }

    ~ArtworkFetcherV1() override { plugin_->reset(0); }

    boost::unique_future<ArtworkResult> fetchArtwork(PlaylistPtr playlist, PlaylistItemPtr item) override;

private:
    DB_artwork_plugin_t* plugin_;
    std::vector<TitleFormatPtr> columns_;
};

boost::unique_future<ArtworkResult> ArtworkFetcherV1::fetchArtwork(PlaylistPtr playlist, PlaylistItemPtr item)
{
    auto columns = evaluateColumns(playlist.get(), item.get(), columns_);

    auto request = boost::intrusive_ptr<ArtworkRequestV1>(
        new ArtworkRequestV1(
            plugin_,
            pathFromUtf8(columns[0]).string(),
            std::move(columns[1]),
            std::move(columns[2])));

    return request->execute();
}

}

std::unique_ptr<ArtworkFetcher> ArtworkFetcher::createV1()
{
    auto artwork = ddbApi->plug_get_for_id("artwork");
    if (!artwork || !PLUG_TEST_COMPAT(artwork, 1, DDB_ARTWORK_VERSION))
        return {};

    auto columns = compileColumns({ "%path%", "%artist%", "%album%" }, false);
    if (columns.empty())
        return {};

    return std::make_unique<ArtworkFetcherV1>(
        reinterpret_cast<DB_artwork_plugin_t*>(artwork),
        std::move(columns));
}

}}
