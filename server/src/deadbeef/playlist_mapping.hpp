#pragma once

#include "util.hpp"

namespace msrv {
namespace deadbeef_plugin {

class PlaylistMapping
{
public:
    PlaylistMapping() : maxId_(0) { }
    ~PlaylistMapping() { }

    const char* getId(ddb_playlist_t* playlist);
    PlaylistPtr resolve(const PlaylistRef& plref);
    int resolveIndex(const PlaylistRef& plref);

    void ensureInitialized()
    {
        if (maxId_ == 0)
            initialize();
    }

private:
    void initialize();

    int64_t maxId_;

    MSRV_NO_COPY_AND_ASSIGN(PlaylistMapping);
};

}}
