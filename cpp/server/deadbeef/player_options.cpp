
#include "player_options.hpp"
#include "../string_utils.hpp"

namespace msrv::player_deadbeef {

int32_t LegacyPlaybackModeOption::getValue()
{
    int order;
    int loop;

    {
        ConfigLockGuard lock(configMutex_);
        order = ddbApi->conf_get_int("playback.order", 0);
        loop = ddbApi->conf_get_int("playback.loop", 0);
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

const std::vector<std::string>& LegacyPlaybackModeOption::enumNames()
{
    return modes_;
}

LegacyPlaybackModeOption::LegacyPlaybackModeOption()
    : EnumPlayerOption("", "", 0)
{
    modes_.reserve(6);
    modes_.emplace_back("Default");
    modes_.emplace_back("Loop track");
    modes_.emplace_back("Loop playlist");
    modes_.emplace_back("Shuffle tracks");
    modes_.emplace_back("Shuffle albums");
    modes_.emplace_back("Random");
}

void LegacyPlaybackModeOption::setModes(int order, int loop)
{
    ConfigLockGuard lock(configMutex_);
    ddbApi->conf_set_int("playback.order", order);
    ddbApi->conf_set_int("playback.loop", loop);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

} // deadbeef_player