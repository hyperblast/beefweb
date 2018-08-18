#pragma once

#include "../player_api.hpp"
#include "common.hpp"

namespace msrv {
namespace player_foobar2000 {

class PlaylistMapping
{
public:
    PlaylistMapping();
    ~PlaylistMapping();

    std::string getId(t_size index);

    t_size resolve(const PlaylistRef& plref);

    void ensureInitialized()
    {
        if (maxId_ == 0)
            initialize();
    }

private:
    bool readId(t_size index, pfc::array_t<char>* buffer);
    void writeId(t_size index, const void* data, size_t size);
    void initialize();

    service_ptr_t<playlist_manager_v4> playlistManager_;
    int64_t maxId_;

    MSRV_NO_COPY_AND_ASSIGN(PlaylistMapping);
};

}}
