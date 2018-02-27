#include "settings.hpp"

namespace msrv {
namespace player_foobar2000 {

SettingsData getCurrentSettings()
{
    SettingsData settings;
    settings.allowRemote = false;
    settings.port = 8880;
    return settings;
}

}}
