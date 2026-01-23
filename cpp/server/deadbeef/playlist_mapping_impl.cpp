#include "playlist_mapping_impl.hpp"

#define PLAYLIST_ID_META MSRV_PROJECT_ID ".unique_id"

namespace msrv {
namespace player_deadbeef {

int32_t PlaylistMappingImpl::getCurrentIndex()
{
    return ddbApi->plt_get_curr_idx();
}

int32_t PlaylistMappingImpl::getCount()
{
    return ddbApi->plt_get_count();
}

std::string PlaylistMappingImpl::readId(int32_t index)
{
    PlaylistPtr playlist(ddbApi->plt_get_for_idx(index));
    assert(playlist);
    const char* id = ddbApi->plt_find_meta(playlist.get(), PLAYLIST_ID_META);
    return id ? id : "";
}

void PlaylistMappingImpl::writeId(int32_t index, const std::string& id)
{
    PlaylistPtr playlist(ddbApi->plt_get_for_idx(index));
    assert(playlist);
    ddbApi->plt_replace_meta(playlist.get(), PLAYLIST_ID_META, id.c_str());
    ddbApi->plt_save_n(index);
}

}
}
