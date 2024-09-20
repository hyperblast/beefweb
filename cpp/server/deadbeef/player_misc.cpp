#include "player.hpp"
#include "../log.hpp"

namespace msrv::player_deadbeef {

PlayerImpl::PlayerImpl()
{
    setPlaybackModeOption(&playbackModeOption_);
    addOption(&shuffleOption_);
    addOption(&repeatOption_);
    addOption(&stopAfterCurrentTrackOption_);
    addOption(&stopAfterCurrentAlbumOption_);
}

PlayerImpl::~PlayerImpl() = default;

std::unique_ptr<WorkQueue> PlayerImpl::createWorkQueue()
{
    return std::make_unique<ThreadWorkQueue>();
}

void PlayerImpl::initArtwork()
{
    artworkFetcher_ = ArtworkFetcher::createV2();

    if (!artworkFetcher_)
    {
        artworkFetcher_ = ArtworkFetcher::createV1();
    }
}

void PlayerImpl::initVersion()
{
    ConfigLockGuard lock(configMutex_);
    version_ = ddbApi->conf_get_str_fast("deadbeef_version", "");
}

void PlayerImpl::connect()
{
    initVersion();
    initArtwork();
}

void PlayerImpl::disconnect()
{
    artworkFetcher_.reset();
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchCurrentArtwork()
{
    if (!artworkFetcher_)
    {
        return boost::make_future(ArtworkResult());
    }

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return boost::make_future(ArtworkResult());

    PlaylistPtr playlist;
    int playlistIndex = ddbApi->streamer_get_current_playlist();
    if (playlistIndex >= 0)
        playlist.reset(ddbApi->plt_get_for_idx(playlistIndex));

    return artworkFetcher_->fetchArtwork(std::move(playlist), std::move(item));
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    if (!artworkFetcher_)
    {
        return boost::make_future(ArtworkResult());
    }

    PlaylistLockGuard lock(playlistMutex_);

    auto playlist = playlists_.resolve(query.playlist);

    auto item = resolvePlaylistItem(playlist.get(), query.index);
    if (!item)
        throw InvalidRequestException("Playlist item index is out of range");

    return artworkFetcher_->fetchArtwork(std::move(playlist), std::move(item));
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
            // Notify player change for the case when currently played item is reordered or removed
            emitEvent(PlayerEvent::PLAYER_CHANGED);
            emitEvent(PlayerEvent::PLAYLIST_ITEMS_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_CREATED:
        case DDB_PLAYLIST_CHANGE_TITLE:
            emitEvent(PlayerEvent::PLAYLIST_SET_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_DELETED:
        case DDB_PLAYLIST_CHANGE_POSITION:
            // Reordering or removing playlists might change index of currently playing playlist
            emitEvent(PlayerEvent::PLAYER_CHANGED);
            emitEvent(PlayerEvent::PLAYLIST_SET_CHANGED);
            break;
        }

        break;
    }
}

}
