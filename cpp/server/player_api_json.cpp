#include "player_api_json.hpp"
#include <stdexcept>

namespace msrv {

namespace {

const char INVALID_PLAYLIST_REF[] = "Invalid playlist reference";
const char INVALID_PLAYBACK_STATE[] = "Invalid playback state";
const char INVALID_VOLUME_TYPE[] = "Invalid volume type";

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

void to_json(Json& json, const VolumeType& type)
{
    switch (type)
    {
    case VolumeType::DB:
        json = "db";
        break;

    case VolumeType::LINEAR:
        json = "linear";
        break;

    default:
        throw std::invalid_argument(INVALID_VOLUME_TYPE);
    }
}

void to_json(Json& json, const PlayerInfo& value)
{
    json["name"] = value.name;
    json["title"] = value.title;
    json["version"] = value.version;
    json["pluginVersion"] = value.pluginVersion;
}

void to_json(Json& json, const VolumeInfo& value)
{
    json["type"] = value.type;
    json["min"] = value.min;
    json["max"] = value.max;
    json["value"] = value.value;
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
    json["info"] = value.info;
    json["playbackState"] = value.playbackState;
    json["volume"] = value.volume;
    json["activeItem"] = value.activeItem;

    if (value.playbackModeOption != nullptr)
    {
        json["playbackMode"] = value.playbackModeOption->getValue();
        json["playbackModes"] = value.playbackModeOption->enumNames();
    }

    if (value.options != nullptr)
    {
        json["options"] = *value.options;
    }
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

void to_json(Json& json, const PlaylistItemsResult& value)
{
    json["offset"] = value.offset;
    json["totalCount"] = value.totalCount;
    json["items"] = value.items;
}

void to_json(Json& json, const std::vector<PlayerOption*>& value)
{
    auto result = Json::array();

    for (auto option : value)
    {
        Json item;

        item["id"] = option->id();
        item["name"] = option->name();

        if (auto boolOption = dynamic_cast<BoolPlayerOption*>(option))
        {
            item["type"] = "bool";
            item["value"] = boolOption->getValue();
        }
        else if (auto enumOption = dynamic_cast<EnumPlayerOption*>(option))
        {
            item["type"] = "enum";
            item["value"] = enumOption->getValue();
            item["enumNames"] = enumOption->enumNames();
        }
        else
        {
            throw std::invalid_argument("unknown option type");
        }

        result.emplace_back(std::move(item));
    }

    json = std::move(result);
}

}
