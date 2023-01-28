
#include "player_options.hpp"
#include "../string_utils.hpp"

#define CONF_PLAYBACK_ORDER "playback.order"
#define CONF_PLAYBACK_LOOP "playback.loop"

namespace msrv::player_deadbeef {

LegacyPlaybackModeOption::LegacyPlaybackModeOption()
    : EnumPlayerOption("", "", {"Default", "Loop track", "Loop playlist", "Shuffle tracks", "Shuffle albums", "Random"})
{
}

int32_t LegacyPlaybackModeOption::getValue()
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
            throw InvalidRequestException("Invalid playback mode");
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
    : EnumPlayerOption("shuffle", "Shuffle", {"Off", "Tracks", "Random Tracks", "Albums"})
{
}

int32_t ShuffleOption::getValue()
{
    return ddbApi->conf_get_int("playback.order", 0);
}

void ShuffleOption::setValue(int32_t value)
{
    ddbApi->conf_set_int(CONF_PLAYBACK_ORDER, value);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

RepeatOption::RepeatOption()
    : EnumPlayerOption("repeat", "Repeat", {"All Tracks", "Off", "One Track"})
{
}

int32_t RepeatOption::getValue()
{
    return ddbApi->conf_get_int(CONF_PLAYBACK_LOOP, 0);
}

void RepeatOption::setValue(int32_t value)
{
    ddbApi->conf_set_int("playback.loop", value);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

}
