#pragma once

#include "defines.hpp"
#include "controller.hpp"

namespace msrv {

class Player;
class Router;
class SettingsStore;

class PlaylistsController : public ControllerBase
{
public:
    PlaylistsController(Request* request, Player* player, SettingsStore* store);
    ~PlaylistsController();

    ResponsePtr getPlaylists();
    ResponsePtr getPlaylistItems();

    void addPlaylist();
    void removePlaylist();
    void movePlaylist();

    void updatePlaylist();
    void clearPlaylist();

    ResponsePtr addItems();

    void moveItemsInPlaylist();
    void copyItemsInPlaylist();

    void moveItemsBetweenPlaylists();
    void copyItemsBetweenPlaylists();

    void removeItems();

    static void defineRoutes(Router* router, Player* player, SettingsStore* store);

private:
    Player* player_;
    SettingsStore* store_;

    MSRV_NO_COPY_AND_ASSIGN(PlaylistsController);
};

}
