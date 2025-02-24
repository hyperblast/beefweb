#pragma once

#include "common.hpp"
#include "../settings.hpp"

#include <string>
#include <vector>

namespace msrv::player_foobar2000::settings_store {

extern cfg_int port;
extern cfg_bool allowRemote;
extern cfg_string musicDirs;
extern cfg_bool authRequired;
extern cfg_string authUser;
extern cfg_string authPassword;
extern cfg_bool allowChangePlaylists;
extern cfg_bool allowChangeOutput;
extern cfg_bool allowChangeClientConfig;

ApiPermissions getPermissions();

std::vector<std::string> getMusicDirs();

void setMusicDirs(const std::vector<std::string>& dirs);

}
