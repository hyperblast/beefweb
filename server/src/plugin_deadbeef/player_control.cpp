#include "player.hpp"

namespace msrv {
namespace plugin_deadbeef {

class TrackQueryImpl : public TrackQuery
{
public:
    TrackQueryImpl(const std::vector<std::string>& columns);
    ~TrackQueryImpl();

    std::vector<TitleFormatPtr> formatters;
};

std::unique_ptr<TrackQuery> PlayerImpl::createTrackQuery(
    const std::vector<std::string>& columns)
{
    return std::make_unique<TrackQueryImpl>(columns);
}

std::unique_ptr<PlayerState> PlayerImpl::queryPlayerState(TrackQuery* activeItemQuery)
{
    auto state = std::make_unique<PlayerState>();

    PlaylistLockGuard lock(playlistMutex_);

    playlists_.ensureInitialized();

    state->playbackState = getPlaybackState();
    queryActiveItem(&state->activeItem, activeItemQuery);
    queryVolume(&state->volume);
    state->options = optionValues();

    return state;
}

PlaybackState PlayerImpl::getPlaybackState()
{
    switch (ddbApi->get_output()->state())
    {
    case OUTPUT_STATE_STOPPED:
        return PlaybackState::STOPPED;

    case OUTPUT_STATE_PLAYING:
        return PlaybackState::PLAYING;

    case OUTPUT_STATE_PAUSED:
        return PlaybackState::PAUSED;

    default:
        throw std::runtime_error("Unknown playback state");
    }
}

void PlayerImpl::queryActiveItem(ActiveItemInfo* info, TrackQuery* query)
{
    int playlistIndex = ddbApi->streamer_get_current_playlist();

    PlaylistPtr playlist;
    if (playlistIndex >= 0)
        playlist.reset(ddbApi->plt_get_for_idx(playlistIndex));

    std::string playlistId;
    if (playlist)
        playlistId = playlists_.getId(playlist.get());

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());

    int32_t itemIndex = -1;
    double itemPosition = -1.0;
    double itemDuration = -1.0;
    std::vector<std::string> columns;

    if (item)
    {
        itemPosition = ddbApi->streamer_get_playpos();
        itemDuration = ddbApi->pl_get_item_duration(item.get());

        if (playlist)
            itemIndex = ddbApi->plt_get_item_idx(playlist.get(), item.get(), PL_MAIN);

        if (query)
        {
            TrackQueryImpl* queryImpl = static_cast<TrackQueryImpl*>(query);
            columns = evaluateColumns(playlist.get(), item.get(), queryImpl->formatters);
        }
    }

    info->playlistId = std::move(playlistId);
    info->playlistIndex = playlistIndex;
    info->index = itemIndex;
    info->position = itemPosition;
    info->duration = itemDuration;
    info->columns = std::move(columns);
}

void PlayerImpl::queryVolume(VolumeInfo* info)
{
    info->db = ddbApi->volume_get_db();
    info->dbMin = ddbApi->volume_get_min_db();
    info->amp = ddbApi->volume_get_amp();
    info->isMuted = ddbApi->audio_is_mute() != 0;
}

void PlayerImpl::playCurrent()
{
    ddbApi->sendmessage(DB_EV_PLAY_CURRENT, 0, 0, 0);
}

void PlayerImpl::playItem(const PlaylistRef& plref, int32_t itemIndex)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr targetPlaylist = playlists_.resolve(plref);
    PlaylistPtr currentPlaylist(ddbApi->plt_get_curr());

    if (targetPlaylist != currentPlaylist)
        ddbApi->plt_set_curr(targetPlaylist.get());

    ddbApi->sendmessage(DB_EV_PLAY_NUM, 0, itemIndex, 0);
}

void PlayerImpl::playRandom()
{
    ddbApi->sendmessage(DB_EV_PLAY_RANDOM, 0, 0, 0);
}

void PlayerImpl::playNext()
{
    ddbApi->sendmessage(DB_EV_NEXT, 0, 0, 0);
}

void PlayerImpl::playPrevious()
{
    ddbApi->sendmessage(DB_EV_PREV, 0, 0, 0);
}

void PlayerImpl::stop()
{
    ddbApi->sendmessage(DB_EV_STOP, 0, 0, 0);
}

void PlayerImpl::pause()
{
    ddbApi->sendmessage(DB_EV_PAUSE, 0, 0, 0);
}

void PlayerImpl::togglePause()
{
    ddbApi->sendmessage(DB_EV_TOGGLE_PAUSE, 0, 0, 0);
}

bool PlayerImpl::setMuted(Switch value)
{
    switch (value)
    {
    case Switch::FALSE:
        ddbApi->audio_set_mute(0);
        break;

    case Switch::TRUE:
        ddbApi->audio_set_mute(1);
        break;

    case Switch::TOGGLE:
        ddbApi->audio_set_mute(!ddbApi->audio_is_mute());
        break;
    }

    emitEvent(PlayerEvent::PLAYER_CHANGED);
    return true;
}

bool PlayerImpl::seekAbsolute(double offsetSeconds)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return false;

    ddbApi->sendmessage(DB_EV_SEEK, 0, static_cast<uint32_t>(offsetSeconds * 1000), 0);
    return true;
}

bool PlayerImpl::seekRelative(double offsetSeconds)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return false;

    float currentPos = ddbApi->streamer_get_playpos();
    uint32_t newPos = static_cast<uint32_t>((currentPos + offsetSeconds) * 1000);
    ddbApi->sendmessage(DB_EV_SEEK, 0, newPos, 0);
    return true;
}

void PlayerImpl::setVolumeDb(double value)
{
    ddbApi->volume_set_db(value);
}

void PlayerImpl::setVolumeAmp(double value)
{
    ddbApi->volume_set_amp(value);
}

TrackQueryImpl::TrackQueryImpl(const std::vector<std::string>& columns)
    : formatters(compileColumns(columns))
{
}

TrackQueryImpl::~TrackQueryImpl()
{
}

}}
