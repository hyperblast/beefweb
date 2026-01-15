
#include "player_options.hpp"
#include "string_utils.hpp"

#define CONF_PLAYBACK_ORDER "playback.order"
#define CONF_PLAYBACK_LOOP "playback.loop"
#define CONF_PLAYLIST_STOP_AFTER_CURRENT "playlist.stop_after_current"
#define CONF_PLAYLIST_STOP_AFTER_ALBUM "playlist.stop_after_album"

namespace msrv::player_deadbeef {

const int32_t repeatOptionValues[] = {
    PLAYBACK_MODE_NOLOOP,
    PLAYBACK_MODE_LOOP_SINGLE,
    PLAYBACK_MODE_LOOP_ALL,
    -1,
};

const int32_t shuffleOptionValues[] = {
    PLAYBACK_ORDER_LINEAR,
    PLAYBACK_ORDER_SHUFFLE_TRACKS,
    PLAYBACK_ORDER_SHUFFLE_ALBUMS,
    PLAYBACK_ORDER_RANDOM,
    -1,
};

int32_t internalToApi(int32_t internalValue, const int32_t* values)
{
    for (int32_t i = 0; values[i] != -1; i++)
    {
        if (values[i] == internalValue)
        {
            return i;
        }
    }

    return 0;
}

LegacyPlaybackModeOption::LegacyPlaybackModeOption()
    : EnumPlayerOption("playbackMode", "Playback mode",
                       {"Default", "Loop track", "Loop playlist", "Shuffle tracks", "Shuffle albums", "Random"})
{
}

int32_t LegacyPlaybackModeOption::getValue() const
{
    int order;
    int loop;

    {
        ConfigLockGuard lock(configMutex_);
        order = ddbApi->conf_get_int(CONF_PLAYBACK_ORDER, 0);
        loop = ddbApi->conf_get_int(CONF_PLAYBACK_LOOP, 0);
    }

    switch (order)
    {
    case PLAYBACK_ORDER_LINEAR:
        switch (loop)
        {
        case PLAYBACK_MODE_NOLOOP:
            return 0;

        case PLAYBACK_MODE_LOOP_SINGLE:
            return 1;

        case PLAYBACK_MODE_LOOP_ALL:
            return 2;

        default:
            throw std::runtime_error("Unknown loop mode: " + toString(loop));
        }

    case PLAYBACK_ORDER_SHUFFLE_TRACKS:
        return 3;

    case PLAYBACK_ORDER_SHUFFLE_ALBUMS:
        return 4;

    case PLAYBACK_ORDER_RANDOM:
        return 5;

    default:
        throw std::runtime_error("Unknown playback order: " + toString(order));
    }
}

void LegacyPlaybackModeOption::setValue(int32_t value)
{
    switch (value)
    {
    case 0:
        setModes(PLAYBACK_ORDER_LINEAR, PLAYBACK_MODE_NOLOOP);
        break;

    case 1:
        setModes(PLAYBACK_ORDER_LINEAR, PLAYBACK_MODE_LOOP_SINGLE);
        break;

    case 2:
        setModes(PLAYBACK_ORDER_LINEAR, PLAYBACK_MODE_LOOP_ALL);
        break;

    case 3:
        setModes(PLAYBACK_ORDER_SHUFFLE_TRACKS, PLAYBACK_MODE_LOOP_ALL);
        break;

    case 4:
        setModes(PLAYBACK_ORDER_SHUFFLE_ALBUMS, PLAYBACK_MODE_LOOP_ALL);
        break;

    case 5:
        setModes(PLAYBACK_ORDER_RANDOM, PLAYBACK_MODE_LOOP_ALL);
        break;

    default:
        throw InvalidRequestException("invalid playback mode");
    }
}

void LegacyPlaybackModeOption::setModes(int order, int loop)
{
    ConfigLockGuard lock(configMutex_);
    ddbApi->conf_set_int(CONF_PLAYBACK_ORDER, order);
    ddbApi->conf_set_int(CONF_PLAYBACK_LOOP, loop);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

ShuffleOption::ShuffleOption()
    : EnumPlayerOption("shuffle", "Shuffle", {"Off", "Tracks", "Albums", "Random Tracks"})
{
}

int32_t ShuffleOption::getValue() const
{
    return internalToApi(ddbApi->conf_get_int(CONF_PLAYBACK_ORDER, 0), shuffleOptionValues);
}

void ShuffleOption::setValue(int32_t value)
{
    ddbApi->conf_set_int(CONF_PLAYBACK_ORDER, shuffleOptionValues[value]);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

RepeatOption::RepeatOption()
    : EnumPlayerOption("repeat", "Repeat", {"Off", "One Track", "All Tracks"})
{
}

int32_t RepeatOption::getValue() const
{
    return internalToApi(ddbApi->conf_get_int(CONF_PLAYBACK_LOOP, 0), repeatOptionValues);
}

void RepeatOption::setValue(int32_t value)
{
    ddbApi->conf_set_int(CONF_PLAYBACK_LOOP, repeatOptionValues[value]);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

StopAfterCurrentTrackOption::StopAfterCurrentTrackOption()
    : BoolPlayerOption("stopAfterCurrentTrack", "Stop after current track")
{
}

bool StopAfterCurrentTrackOption::getValue() const
{
    return ddbApi->conf_get_int(CONF_PLAYLIST_STOP_AFTER_CURRENT, 0) != 0;
}

void StopAfterCurrentTrackOption::setValue(bool value)
{
    ddbApi->conf_set_int(CONF_PLAYLIST_STOP_AFTER_CURRENT, value ? 1 : 0);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

StopAfterCurrentAlbumOption::StopAfterCurrentAlbumOption()
    : BoolPlayerOption("stopAfterCurrentAlbum", "Stop after current album")
{
}

bool StopAfterCurrentAlbumOption::getValue() const
{
    return ddbApi->conf_get_int(CONF_PLAYLIST_STOP_AFTER_ALBUM, 0) != 0;
}

void StopAfterCurrentAlbumOption::setValue(bool value)
{
    ddbApi->conf_set_int(CONF_PLAYLIST_STOP_AFTER_ALBUM, value ? 1 : 0);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

}
