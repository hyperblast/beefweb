#include "player.hpp"
#include "../project_info.hpp"
#include "../string_utils.hpp"

namespace msrv {
namespace player_deadbeef {

namespace {

class TrackQueryImpl : public TrackQuery
{
public:
    TrackQueryImpl(const std::vector<std::string>& columns)
        : formatters(compileColumns(columns))
    {
    }

    ~TrackQueryImpl() = default;

    std::vector<TitleFormatPtr> formatters;
};

inline float clampVolume(float val)
{
    return std::max(std::min(val, 0.0f), ddbApi->volume_get_min_db());
}

}

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
    queryInfo(&state->info);
    queryActiveItem(&state->activeItem, activeItemQuery);
    queryVolume(&state->volume);
    state->playbackModeOption = &playbackModeOption_;
    state->options = &options();
    return state;
}

void PlayerImpl::queryInfo(PlayerInfo* info)
{
    info->name = "deadbeef";
    info->title = "DeaDBeeF";
    info->version = version_;
    info->pluginVersion = MSRV_VERSION_STRING;
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
    info->type = VolumeType::DB;
    info->min = ddbApi->volume_get_min_db();
    info->max = 0.0;
    info->value = ddbApi->volume_get_db();
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

bool PlayerImpl::playNextBy(const std::string& expression)
{
    return playNextBy(expression, ddbApi->pl_get_next);
}

void PlayerImpl::playPrevious()
{
    ddbApi->sendmessage(DB_EV_PREV, 0, 0, 0);
}

bool PlayerImpl::playPreviousBy(const std::string& expression)
{
    return playNextBy(expression, ddbApi->pl_get_prev);
}

bool PlayerImpl::playNextBy(const std::string& expression, PlayerImpl::PlaylistItemSelector selector)
{
    TitleFormatPtr format(ddbApi->tf_compile(expression.c_str()));
    if (!format)
        throw InvalidRequestException("Invalid format expression: " + expression);

    PlaylistLockGuard lock(playlistMutex_);

    int playlistIndex = ddbApi->streamer_get_current_playlist();
    if (playlistIndex < 0)
        return false;

    PlaylistPtr playlist(ddbApi->plt_get_for_idx(playlistIndex));
    PlaylistItemPtr activeItem(ddbApi->streamer_get_playing_track());

    if (!activeItem)
        return false;

    ddb_tf_context_t context{};
    context._size = sizeof(context);
    context.plt = playlist.get();

    auto eval = [&context, &format, &expression] (DB_playItem_t* item, char* buffer)
    {
        context.it = item;
        auto ret = ddbApi->tf_eval(&context, format.get(), buffer, TITLE_FORMAT_BUFFER_SIZE);
        if (ret < 0)
            throw std::runtime_error("Failed to evaluate expression: " + expression);
    };

    char activeValue[TITLE_FORMAT_BUFFER_SIZE];
    char currentValue[TITLE_FORMAT_BUFFER_SIZE];

    eval(activeItem.get(), activeValue);

    for (
        auto current = PlaylistItemPtr(selector(activeItem.get(), PL_MAIN));
        current;
        current = PlaylistItemPtr(selector(current.get(), PL_MAIN)))
    {
        eval(current.get(), currentValue);

        if (strcmp(activeValue, currentValue) == 0)
            continue;

        auto index = ddbApi->plt_get_item_idx(playlist.get(), current.get(), PL_MAIN);
        if (index < 0)
            return false;

        ddbApi->sendmessage(DB_EV_PLAY_NUM, 0, index, 0);
        return true;
    }

    return false;
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

void PlayerImpl::setMuted(Switch value)
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
}

void PlayerImpl::seekAbsolute(double offsetSeconds)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return;

    ddbApi->sendmessage(DB_EV_SEEK, 0, static_cast<uint32_t>(offsetSeconds * 1000), 0);
}

void PlayerImpl::seekRelative(double offsetSeconds)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return;

    float currentPos = ddbApi->streamer_get_playpos();
    uint32_t newPos = static_cast<uint32_t>((currentPos + offsetSeconds) * 1000);
    ddbApi->sendmessage(DB_EV_SEEK, 0, newPos, 0);
}

void PlayerImpl::setVolume(double value)
{
    ddbApi->volume_set_db(clampVolume(value));
}

}}
