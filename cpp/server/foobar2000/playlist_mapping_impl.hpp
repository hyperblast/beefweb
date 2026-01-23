#pragma once

#include "player_api.hpp"
#include "playlist_mapping.hpp"
#include "common.hpp"

namespace msrv {
namespace player_foobar2000 {

class PlaylistMappingImpl final : public PlaylistMapping
{
protected:
    int32_t getCurrentIndex() override;
    int32_t getCount() override;
    std::string readId(int32_t index) override;
    void writeId(int32_t index, const std::string& id) override;

    service_ptr_t<playlist_manager_v4> playlistManager_ = playlist_manager_v4::get();
};

}
}
