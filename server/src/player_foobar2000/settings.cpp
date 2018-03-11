#include "settings.hpp"
#include "../project_info.hpp"
#include "../file_system.hpp"

namespace msrv {
namespace player_foobar2000 {

SettingsData getCurrentSettings()
{
    SettingsData settings;
    settings.allowRemote = false;
    settings.port = 8880;
    settings.staticDir = pathToUtf8(getModulePath(getCurrentSettings).parent_path() / pathFromUtf8(MSRV_WEB_ROOT));
    settings.musicDirs.emplace_back("D:\\downloads");
    return settings;
}

}}
