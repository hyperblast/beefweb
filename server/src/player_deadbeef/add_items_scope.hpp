#pragma once

#include "common.hpp"

namespace msrv {
namespace player_deadbeef {

class AddItemsScope
{
public:
    AddItemsScope(ddb_playlist_t* playlist, int visibility);
    ~AddItemsScope();

    void setLastItem(PlaylistItemPtr item) { lastItem_ = std::move(item); }
    bool add(const std::string& path);

private:
    bool handleAdd(ddb_playItem_t* item);
    ddb_playItem_t* addDir(const char* path);
    ddb_playItem_t* addFile(const char* path);
    ddb_playItem_t* addPlaylist(const char* path);

    ddb_playlist_t* playlist_;
    int visibility_;
    bool created_;
    int aborted_;
    PlaylistItemPtr lastItem_;

    MSRV_NO_COPY_AND_ASSIGN(AddItemsScope);
};

}}
