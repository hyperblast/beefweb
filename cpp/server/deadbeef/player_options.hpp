#pragma once

#include "../player_api.hpp"
#include "utils.hpp"

namespace msrv::player_deadbeef {

class LegacyPlaybackModeOption : public EnumPlayerOption
{
public:
    LegacyPlaybackModeOption();

    int32_t getValue() override;
    void setValue(int32_t value) override;
    const std::vector<std::string>& enumNames() override;

private:
    ConfigMutex configMutex_;
    std::vector<std::string> modes_;

    void setModes(int order, int loop);
};

}
