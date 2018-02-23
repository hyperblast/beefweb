#pragma once

#include "common.hpp"

namespace msrv {
namespace plugin_deadbeef {

class PlaybackOrderOption : public PlayerOption
{
public:
    PlaybackOrderOption();
    ~PlaybackOrderOption();

protected:
    virtual int32_t doGet() override;
    virtual void doSet(int32_t value) override;
};

class PlaybackLoopOption : public PlayerOption
{
public:
    PlaybackLoopOption();
    ~PlaybackLoopOption();

protected:
    virtual int32_t doGet() override;
    virtual void doSet(int32_t value) override;
};

}}
