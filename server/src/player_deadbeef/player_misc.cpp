#include "player.hpp"
#include "../log.hpp"
#include "artwork_request.hpp"
#include <stdlib.h>

namespace msrv {
namespace player_deadbeef {

PlayerImpl::PlayerImpl()
    : artworkPlugin_(nullptr)
{
    initPlaybackModes();
}

PlayerImpl::~PlayerImpl() = default;

WorkQueue* PlayerImpl::workQueue()
{
    return &workQueue_;
}

void PlayerImpl::initArtwork()
{
    auto artwork = ddbApi->plug_get_for_id("artwork");
    if (!artwork || !PLUG_TEST_COMPAT(artwork, 1, DDB_ARTWORK_VERSION))
        return;

    artworkRequestColumns_ = compileColumns({ "%artist%", "%album%", "%path%" }, false);
    if (artworkRequestColumns_.empty())
        return;

    artworkPlugin_ = reinterpret_cast<DB_artwork_plugin_t*>(artwork);
}

void PlayerImpl::readVersion()
{
    TitleFormatPtr versionFormat(ddbApi->tf_compile("%_deadbeef_version%"));

    if (!versionFormat)
        return;

    ddb_tf_context_t context;
    memset(&context, 0, sizeof(context));
    context._size = sizeof(context);

    char buffer[64];
    int ret = ddbApi->tf_eval(&context, versionFormat.get(), buffer, sizeof(buffer));
    if (ret >= 0)
        version_ = buffer;
}

void PlayerImpl::connect()
{
    readVersion();
    initArtwork();
}

void PlayerImpl::disconnect()
{
    if (artworkPlugin_)
        artworkPlugin_->reset(0);
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    return artworkPlugin_
        ? buildArtworkRequest(query)->execute()
        : boost::make_future(ArtworkResult());
}

boost::intrusive_ptr<ArtworkRequest> PlayerImpl::buildArtworkRequest(const ArtworkQuery& query)
{
    PlaylistLockGuard lock(playlistMutex_);

    auto playlist = playlists_.resolve(query.playlist);

    auto item = resolvePlaylistItem(playlist.get(), query.index);
    if (!item)
        throw InvalidRequestException("Playlist item index is out of range");

    auto columns = evaluateColumns(playlist.get(), item.get(), artworkRequestColumns_);

    return ArtworkRequest::create(
        artworkPlugin_,
        std::move(columns[0]),
        std::move(columns[1]),
        std::move(columns[2]));
}

void PlayerImpl::handleMessage(uint32_t id, uintptr_t, uint32_t p1, uint32_t)
{
    switch (id)
    {
    case DB_EV_CONFIGCHANGED:
    case DB_EV_SONGSTARTED:
    case DB_EV_SONGCHANGED:
    case DB_EV_SONGFINISHED:
    case DB_EV_PAUSED:
    case DB_EV_SEEKED:
    case DB_EV_VOLUMECHANGED:
        emitEvent(PlayerEvent::PLAYER_CHANGED);
        break;

    case DB_EV_PLAYLISTCHANGED:
        switch (p1)
        {
        case DDB_PLAYLIST_CHANGE_CONTENT:
            emitEvent(PlayerEvent::PLAYLIST_ITEMS_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_CREATED:
        case DDB_PLAYLIST_CHANGE_DELETED:
        case DDB_PLAYLIST_CHANGE_TITLE:
        case DDB_PLAYLIST_CHANGE_POSITION:
            emitEvent(PlayerEvent::PLAYLIST_SET_CHANGED);
            break;
        }

        break;
    }
}

}}
