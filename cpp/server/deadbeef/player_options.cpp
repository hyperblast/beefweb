
#include "player_options.hpp"
#include "../string_utils.hpp"

#define CONF_PLAYBACK_ORDER "playback.order"
#define CONF_PLAYBACK_LOOP "playback.loop"

namespace msrv::player_deadbeef {

struct OptionMapping
{
    constexpr OptionMapping(int32_t apiVal, int32_t internalValue)
        : api(apiVal), internal(internalValue) { }

    int32_t api;
    int32_t internal;
};

OptionMapping repeatOptionMapping[] = {
    OptionMapping(0, PLAYBACK_MODE_NOLOOP),
    OptionMapping(1, PLAYBACK_MODE_LOOP_SINGLE),
    OptionMapping(2, PLAYBACK_MODE_LOOP_ALL),
    OptionMapping(-1, -1),
};

OptionMapping shuffleOptionMapping[] = {
    OptionMapping(0, PLAYBACK_ORDER_LINEAR),
    OptionMapping(1, PLAYBACK_ORDER_SHUFFLE_TRACKS),
    OptionMapping(2, PLAYBACK_ORDER_SHUFFLE_ALBUMS),
    OptionMapping(3, PLAYBACK_ORDER_RANDOM),
    OptionMapping(-1, -1),
};

int32_t toInternalValue(int32_t api, OptionMapping* mappings)
{
    for (size_t i = 0; mappings[i].api != -1; i++)
    {
        if (mappings[i].api == api)
        {
            return mappings[i].internal;
        }
    }

    return 0;
}

int32_t toApiValue(int32_t internal, OptionMapping* mappings)
{
    for (size_t i = 0; mappings[i].internal != -1; i++)
    {
        if (mappings[i].internal == internal)
        {
            return mappings[i].internal;
        }
    }

    return 0;
}

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
    : EnumPlayerOption("shuffle", "Shuffle", {"Off", "Tracks", "Albums", "Random Tracks"})
{
}

int32_t ShuffleOption::getValue()
{
    return toApiValue(ddbApi->conf_get_int(CONF_PLAYBACK_ORDER, 0), shuffleOptionMapping);
}

void ShuffleOption::setValue(int32_t value)
{
    ddbApi->conf_set_int(CONF_PLAYBACK_ORDER, toInternalValue(value, shuffleOptionMapping));
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

RepeatOption::RepeatOption()
    : EnumPlayerOption("repeat", "Repeat", {"Off", "One Track", "All Tracks"})
{
}

int32_t RepeatOption::getValue()
{
    return toApiValue(ddbApi->conf_get_int(CONF_PLAYBACK_LOOP, 0), repeatOptionMapping);
}

void RepeatOption::setValue(int32_t value)
{
    ddbApi->conf_set_int(CONF_PLAYBACK_LOOP, toInternalValue(value, repeatOptionMapping));
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

}
