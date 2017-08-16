#include "player_api_json.hpp"

namespace msrv {

namespace {
constexpr char INVALID_PLAYLIST_REF[] = "invalid playlist reference";
constexpr char INVALID_PLAYBACK_STATE[] = "invalid playback state";
}

void from_json(const Json& json, PlaylistRef& value)
{
    if (json.is_number())
    {
        value = PlaylistRef(json.get<int32_t>());
        return;
    }

    if (json.is_string())
    {
        value = PlaylistRef(json.get<std::string>());
        return;
    }

    throw std::invalid_argument(INVALID_PLAYLIST_REF);
}

void to_json(Json& json, const PlaylistRef& value)
{
    switch (value.type())
    {
    case PlaylistRefType::ID:
        json = value.id();
        break;

    case PlaylistRefType::INDEX:
        json = value.index();
        break;

    default:
        throw std::invalid_argument(INVALID_PLAYLIST_REF);
    }
}

void to_json(Json& json, const PlaybackState& value)
{
    switch (value)
    {
    case PlaybackState::PAUSED:
        json = "paused";
        break;

    case PlaybackState::PLAYING:
        json = "playing";
        break;

    case PlaybackState::STOPPED:
        json = "stopped";
        break;

    default:
        throw std::invalid_argument(INVALID_PLAYBACK_STATE);
    }
}

void to_json(Json& json, const VolumeInfo& value)
{
    json["db"] = value.db;
    json["dbMin"] = value.dbMin;
    json["amp"] = value.amp;
    json["isMuted"] = value.isMuted;
}

void to_json(Json& json, const ActiveItemInfo& value)
{
    json["index"] = value.index;
    json["position"] = value.position;
    json["duration"] = value.duration;
    json["playlistId"] = value.playlistId;
    json["playlistIndex"] = value.playlistIndex;
    json["columns"] = value.columns;
}

void to_json(Json& json, const PlayerState& value)
{
    json["playbackState"] = value.playbackState;
    json["volume"] = value.volume;
    json["activeItem"] = value.activeItem;
    json["options"] = value.options;
}

void to_json(Json& json, const PlaylistInfo& value)
{
    json["id"] = value.id;
    json["index"] = value.index;
    json["title"] = value.title;
    json["isCurrent"] = value.isCurrent;
    json["itemCount"] = value.itemCount;
    json["totalTime"] = value.totalTime;
}

void to_json(Json& json, const PlaylistItemInfo& value)
{
    json["columns"] = value.columns;
}

}
