#include "artwork_fetcher.hpp"
#include "../log.hpp"

#include <deadbeef/artwork.h>
#include <boost/smart_ptr/intrusive_ref_counter.hpp>
#include <boost/smart_ptr/intrusive_ptr.hpp>

namespace msrv {
namespace player_deadbeef {

namespace {

class CoverInfoDeleter
{
public:
    explicit CoverInfoDeleter(ddb_artwork_plugin_t* plugin) : plugin_(plugin) { }

    void operator()(ddb_cover_info_t* info) { plugin_->cover_info_release(info); }

private:
    ddb_artwork_plugin_t* plugin_;
};

using CoverInfoPtr = std::unique_ptr<ddb_cover_info_t, CoverInfoDeleter>;

class ArtworkRequestV2 : public boost::intrusive_ref_counter<ArtworkRequestV2, boost::thread_safe_counter>
{
public:
    ArtworkRequestV2(ddb_artwork_plugin_t* plugin, int64_t sourceId, PlaylistItemPtr item)
        : plugin_(plugin), query_{}, item_(std::move(item))
    {
        memset(&query_, 0, sizeof(query_));
        query_._size = sizeof(query_);
        query_.track = item_.get();
        query_.user_data = this;
        query_.source_id = sourceId;
    }

    boost::unique_future<ArtworkResult> execute();

private:
    static void callbackWrapper(int error, ddb_cover_query_t *query, ddb_cover_info_t *cover);
    void callback(int error, ddb_cover_info_t* cover);

    ddb_artwork_plugin_t* plugin_;
    ddb_cover_query_t query_;
    PlaylistItemPtr item_;
    boost::promise<ArtworkResult> resultPromise_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkRequestV2);
};

class ArtworkFetcherV2 : public ArtworkFetcher
{
public:
    explicit ArtworkFetcherV2(ddb_artwork_plugin_t* plugin)
        : plugin_(plugin), sourceId_(plugin->allocate_source_id()) { }

    ~ArtworkFetcherV2() override { plugin_->cancel_queries_with_source_id(sourceId_); }

    boost::unique_future<ArtworkResult> fetchArtwork(PlaylistPtr playlist, PlaylistItemPtr item) override;

private:
    ddb_artwork_plugin_t* plugin_;
    int64_t sourceId_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkFetcherV2);
};

void ArtworkRequestV2::callbackWrapper(int error, ddb_cover_query_t* query, ddb_cover_info_t* cover)
{
    boost::intrusive_ptr<ArtworkRequestV2> request(
        reinterpret_cast<ArtworkRequestV2*>(query->user_data), false);

    tryCatchLog([&] { request->callback(error, cover); });
}

boost::unique_future<ArtworkResult> ArtworkRequestV2::execute()
{
    auto result = resultPromise_.get_future();
    intrusive_ptr_add_ref(this);
    plugin_->cover_get(&query_, callbackWrapper);
    return result;
}

void ArtworkRequestV2::callback(int error, ddb_cover_info_t* cover)
{
    CoverInfoPtr coverPtr(cover, CoverInfoDeleter(plugin_));

    if (!error && cover && cover->cover_found && cover->image_filename)
    {
        resultPromise_.set_value(ArtworkResult(std::string(cover->image_filename)));
    }
    else
    {
        resultPromise_.set_value(ArtworkResult());
    }
}

boost::unique_future<ArtworkResult> ArtworkFetcherV2::fetchArtwork(PlaylistPtr, PlaylistItemPtr item)
{
    auto request = boost::intrusive_ptr<ArtworkRequestV2>(
        new ArtworkRequestV2(plugin_, sourceId_, std::move(item)));

    return request->execute();
}

}

std::unique_ptr<ArtworkFetcher> ArtworkFetcher::createV2()
{
    auto plugin = ddbApi->plug_get_for_id("artwork2");
    if (!plugin || !PLUG_TEST_COMPAT(plugin, DDB_ARTWORK_MAJOR_VERSION, DDB_ARTWORK_MINOR_VERSION))
        return {};

    return std::make_unique<ArtworkFetcherV2>(reinterpret_cast<ddb_artwork_plugin_t*>(plugin));
}

}}
