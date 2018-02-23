#include "settings.hpp"

namespace msrv {
namespace plugin_foobar {

SettingsData getCurrentSettings()
{
    SettingsData settings;
    settings.allowRemote = false;
    settings.port = 8880;
    return settings;
}

}}
