#pragma once

#include "player_api.hpp"
#include "json.hpp"

namespace msrv {

void from_json(const Json& json, PlaylistRef& value);
void to_json(Json& json, const PlaylistRef& value);

void to_json(Json& json, const PlaybackState& value);
void to_json(Json& json, const PlayerInfo& value);
void to_json(Json& json, const VolumeInfo& value);
void to_json(Json& json, const ActiveItemInfo& value);
void to_json(Json& json, const PlayerState& value);
void to_json(Json& json, const PlaylistInfo& value);
void to_json(Json& json, const PlaylistItemInfo& value);
void to_json(Json& json, const PlaylistItemsResult& value);

}
