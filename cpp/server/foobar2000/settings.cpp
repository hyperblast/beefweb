#include "settings.hpp"
#include "project_info.hpp"
#include "../string_utils.hpp"
#include "../core_types_parsers.hpp"

namespace msrv::player_foobar2000::settings_store {

namespace {

// {05DE11AE-55BA-4049-B469-3F612A071EB7}
const GUID portGuid = {0x5de11ae, 0x55ba, 0x4049, {0xb4, 0x69, 0x3f, 0x61, 0x2a, 0x7, 0x1e, 0xb7}};

// {2F9DFB35-78B5-4D23-B859-9AF51A9B191C}
const GUID allowRemoteGuid = {0x2f9dfb35, 0x78b5, 0x4d23, {0xb8, 0x59, 0x9a, 0xf5, 0x1a, 0x9b, 0x19, 0x1c}};

// {015E07E1-F18B-435A-83CF-9E33E1FFA8CB}
const GUID musicDirsGuid = {0x15e07e1, 0xf18b, 0x435a, {0x83, 0xcf, 0x9e, 0x33, 0xe1, 0xff, 0xa8, 0xcb}};

// {042464C4-76D6-49E7-BF4B-534F33FD2A24}
const GUID authRequiredGuid = {0x42464c4, 0x76d6, 0x49e7, {0xbf, 0x4b, 0x53, 0x4f, 0x33, 0xfd, 0x2a, 0x24}};

// {297FC24F-7058-4CCA-AABD-5D941DE08D77}
const GUID authUserGuid = {0x297fc24f, 0x7058, 0x4cca, {0xaa, 0xbd, 0x5d, 0x94, 0x1d, 0xe0, 0x8d, 0x77}};

// {D11784C8-ACF7-4F1B-A6E4-4065F015CE6C}
const GUID authPasswordGuid = {0xd11784c8, 0xacf7, 0x4f1b, {0xa6, 0xe4, 0x40, 0x65, 0xf0, 0x15, 0xce, 0x6c}};

// {C24EBB7B-F994-4860-871F-D215A0296C7E}
static const GUID allowChangePlaylistsGuid = {0xc24ebb7b, 0xf994, 0x4860, {0x87, 0x1f, 0xd2, 0x15, 0xa0, 0x29, 0x6c, 0x7e}};

// {89BEF0B5-2381-45CA-BE85-800FD5F83B62}
static const GUID allowChangeOutputGuid = {0x89bef0b5, 0x2381, 0x45ca, {0xbe, 0x85, 0x80, 0xf, 0xd5, 0xf8, 0x3b, 0x62}};

// {44DD6586-06D6-4E14-AC35-64EB0AFB43BA}
static const GUID allowChangeClientConfigGuid = {0x44dd6586, 0x6d6, 0x4e14, {0xac, 0x35, 0x64, 0xeb, 0xa, 0xfb, 0x43, 0xba}};

constexpr char listSeparator = '\n';

}

cfg_int port(portGuid, MSRV_DEFAULT_PORT);
cfg_bool allowRemote(allowRemoteGuid, true);
cfg_string musicDirs(musicDirsGuid, "");
cfg_bool authRequired(authRequiredGuid, false);
cfg_string authUser(authUserGuid, "");
cfg_string authPassword(authPasswordGuid, "");
cfg_bool allowChangePlaylists(allowChangePlaylistsGuid, true);
cfg_bool allowChangeOutput(allowChangeOutputGuid, true);
cfg_bool allowChangeClientConfig(allowChangeClientConfigGuid, true);

ApiPermissions getPermissions()
{
    auto result = ApiPermissions::NONE;

    if (allowChangePlaylists)
        result |= ApiPermissions::CHANGE_PLAYLISTS;

    if (allowChangeOutput)
        result |= ApiPermissions::CHANGE_OUTPUT;

    if (allowChangeClientConfig)
        result |= ApiPermissions::CHANGE_CLIENT_CONFIG;

    return result;
}

std::vector<std::string> getMusicDirs()
{
    StringView dirs(musicDirs.get_ptr(), musicDirs.get_length());
    return parseValueList<std::string>(dirs, listSeparator);
}

void setMusicDirs(const std::vector<std::string>& dirs)
{
    std::string str;

    for (auto& dir : dirs)
    {
        str.append(dir);
        str.push_back(listSeparator);
    }

    if (!str.empty())
        str.pop_back();

    musicDirs.set_string(str.data(), str.length());
}

}
