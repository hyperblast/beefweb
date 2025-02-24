#pragma once

#include "common.hpp"
#include <string>
#include <vector>

namespace msrv {
namespace player_foobar2000 {

namespace settings_store {
extern cfg_int port;
extern cfg_bool allowRemote;
extern cfg_string musicDirs;
extern cfg_bool authRequired;
extern cfg_string authUser;
extern cfg_string authPassword;
std::vector<std::string> getMusicDirs();
void setMusicDirs(const std::vector<std::string>& dirs);
};

}
}
