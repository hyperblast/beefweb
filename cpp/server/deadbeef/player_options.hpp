#pragma once

#include "../player_api.hpp"
#include "utils.hpp"

namespace msrv::player_deadbeef {

class LegacyPlaybackModeOption : public EnumPlayerOption
{
public:
    LegacyPlaybackModeOption();

    int32_t getValue() const override;
    void setValue(int32_t value) override;

private:
    mutable ConfigMutex configMutex_;

    void setModes(int order, int loop);
};

class ShuffleOption : public EnumPlayerOption
{
public:
    ShuffleOption();

    int32_t getValue() const override;
    void setValue(int32_t value) override;
};

class RepeatOption : public EnumPlayerOption
{
public:
    RepeatOption();

    int32_t getValue() const override;
    void setValue(int32_t value) override;
};

class StopAfterCurrentTrackOption : public BoolPlayerOption
{
public:
    StopAfterCurrentTrackOption();

    bool getValue() const override;
    void setValue(bool value) override;
};

class StopAfterCurrentAlbumOption : public BoolPlayerOption
{
public:
    StopAfterCurrentAlbumOption();

    bool getValue() const override;
    void setValue(bool value) override;
};

}
