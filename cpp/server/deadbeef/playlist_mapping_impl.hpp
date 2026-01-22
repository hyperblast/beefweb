#pragma once

#include "playlist_mapping.hpp"
#include "utils.hpp"

namespace msrv {
namespace player_deadbeef {

class PlaylistMappingImpl final : public PlaylistMapping
{
public:
    PlaylistPtr getPlaylist(const PlaylistRef& plref)
    {
        return PlaylistPtr(ddbApi->plt_get_for_idx(getIndex(plref)));
    }

    std::pair<PlaylistPtr, int32_t> getPlaylistAndIndex(const PlaylistRef& plref)
    {
        auto index = getIndex(plref);
        return std::make_pair(PlaylistPtr(ddbApi->plt_get_for_idx(index)), index);
    }

protected:
    int32_t getCurrentIndex() override;
    int32_t getCount() override;
    std::string readId(int32_t index) override;
    void writeId(int32_t index, const std::string& id) override;
};

}
}
