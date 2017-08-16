#include "player_options.hpp"

namespace msrv {
namespace deadbeef_plugin {

PlaybackOrderOption::PlaybackOrderOption()
    : PlayerOption("order")
{
    defineValue("linear", PLAYBACK_ORDER_LINEAR);
    defineValue("random", PLAYBACK_ORDER_RANDOM);
    defineValue("shuffleAlbums", PLAYBACK_ORDER_SHUFFLE_ALBUMS);
    defineValue("shuffleTracks", PLAYBACK_ORDER_SHUFFLE_TRACKS);
}

PlaybackOrderOption::~PlaybackOrderOption()
{
}

int32_t PlaybackOrderOption::doGet()
{
    return ddbApi->conf_get_int("playback.order", 0);
}

void PlaybackOrderOption::doSet(int32_t value)
{
    ddbApi->conf_set_int("playback.order", value);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

PlaybackLoopOption::PlaybackLoopOption()
    : PlayerOption("loop")
{
    defineValue("none", PLAYBACK_MODE_NOLOOP);
    defineValue("single", PLAYBACK_MODE_LOOP_SINGLE);
    defineValue("all", PLAYBACK_MODE_LOOP_ALL);
}

PlaybackLoopOption::~PlaybackLoopOption()
{
}

int32_t PlaybackLoopOption::doGet()
{
    return ddbApi->conf_get_int("playback.loop", 0);
}

void PlaybackLoopOption::doSet(int32_t value)
{
    ddbApi->conf_set_int("playback.loop", value);
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

}}
