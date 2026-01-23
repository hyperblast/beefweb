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
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(getIndex(plref)));
        assert(playlist);
        return playlist;
    }

    std::pair<PlaylistPtr, int32_t> getPlaylistAndIndex(const PlaylistRef& plref)
    {
        auto index = getIndex(plref);
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(index));
        assert(playlist);
        return std::make_pair(std::move(playlist), index);
    }

protected:
    int32_t getCurrentIndex() override;
    int32_t getCount() override;
    std::string readId(int32_t index) override;
    void writeId(int32_t index, const std::string& id) override;
};

}
}
