#pragma once

#include "common.hpp"
#include <string>
#include <vector>

namespace msrv {
namespace player_foobar2000 {

struct SettingVars
{
    static cfg_int port;
    static cfg_bool allowRemote;
    static cfg_string musicDirs;
    static cfg_bool authRequired;
    static cfg_string authUser;
    static cfg_string authPassword;

    static std::vector <std::string> getMusicDirs();
    static void setMusicDirs(const std::vector <std::string>& dirs);
};

}
}
