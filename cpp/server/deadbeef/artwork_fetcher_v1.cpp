#include "artwork_fetcher.hpp"
#include "../file_system.hpp"
#include "../log.hpp"
#include "utils.hpp"

#include <deadbeef/artwork-legacy.h>

namespace msrv {
namespace player_deadbeef {

class ArtworkRequestV1
    : public boost::intrusive_ref_counter<ArtworkRequestV1, boost::thread_safe_counter>
{
public:
    static boost::intrusive_ptr<ArtworkRequestV1> create()
    {
        return {new ArtworkRequestV1()};
    }

    ~ArtworkRequestV1() = default;

    boost::unique_future<ArtworkResult> execute(
        DB_artwork_plugin_t* plugin, const char* filePath, const char* artist, const char* album);

private:
    ArtworkRequestV1() = default;

    static void callback(const char* filePath, const char* artist, const char* album, void* data);

    void complete(const char* filePath, const char* artist, const char* album);

    std::string resultPath_;
    boost::promise<ArtworkResult> promise_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkRequestV1);
};

boost::unique_future<ArtworkResult> ArtworkRequestV1::execute(
    DB_artwork_plugin_t* plugin, const char* filePath, const char* artist, const char* album)
{
    logDebug("artwork query: filePath = %s; artist = %s; album = %s", filePath, artist, album);

    char resultPath[PATH_MAX];
    plugin->make_cache_path2(resultPath, sizeof(resultPath), filePath, album, artist, -1);
    resultPath_ = pathToUtf8(Path(resultPath));
    logDebug("artwork result path: %s", resultPath_.c_str());

    intrusive_ptr_add_ref(this);
    MallocPtr<char> cachedResultPath(plugin->get_album_art(filePath, artist, album, -1, callback, this));

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
            "artwork found: filePath = %s; artist = %s; album = %s",
            filePath ? filePath : "",
            artist ? artist : "",
            album ? album : "");

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
    explicit ArtworkFetcherV1(DB_artwork_plugin_t* plugin, std::vector<TitleFormatPtr> columns)
        : plugin_(plugin), columns_(std::move(columns)) {  }

    ~ArtworkFetcherV1() override { plugin_->reset(0); }

    boost::unique_future<ArtworkResult> fetchArtwork(PlaylistPtr playlist, PlaylistItemPtr item) override;

private:
    DB_artwork_plugin_t* plugin_;
    std::vector<TitleFormatPtr> columns_;
};

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

boost::unique_future<ArtworkResult> ArtworkFetcherV1::fetchArtwork(PlaylistPtr playlist, PlaylistItemPtr item)
{
    auto columns = evaluateColumns(playlist.get(), item.get(), columns_);
    auto path = pathFromUtf8(columns[0]);
    auto pathString = path.empty() ? nullptr : path.c_str();
    auto artist = columns[1].empty() ? nullptr : columns[1].c_str();
    auto album = columns[2].empty() ? nullptr : columns[2].c_str();
    auto request = ArtworkRequestV1::create();
    return request->execute(plugin_, pathString, artist, album);
}

}}
