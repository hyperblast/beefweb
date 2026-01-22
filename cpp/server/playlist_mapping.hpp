#pragma once

#include "player_api.hpp"

#include <string>
#include <vector>
#include <unordered_map>

namespace msrv {

class PlaylistMapping
{
public:
    PlaylistMapping() = default;
    virtual ~PlaylistMapping() = default;

    void invalidate() { invalid_ = true; }

    int32_t getIndex(const PlaylistRef& plref);

    const std::string& getId(int32_t index)
    {
        if (invalid_)
            rebuild();

        assert(index >= 0 && static_cast<size_t>(index) < allIds_.size());
        return allIds_[index];
    }

    const std::vector<std::string>& playlistIds()
    {
        if (invalid_)
            rebuild();

        return allIds_;
    }

    void rebuild();

protected:
    virtual int32_t getCurrentIndex() = 0;
    virtual int32_t getCount() = 0;
    virtual std::string readId(int32_t index) = 0;
    virtual void writeId(int32_t index, const std::string& id) = 0;

private:
    std::unordered_map<std::string, int32_t> idToIndex_;
    std::vector<std::string> allIds_;
    uint64_t maxId_ = 0;
    std::atomic_bool invalid_ = true;
};

}