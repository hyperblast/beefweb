#pragma once

#include "defines.hpp"
#include "controller.hpp"
#include "settings.hpp"

namespace msrv {

class Player;

class Router;

class PlaylistsController : public ControllerBase
{
public:
    PlaylistsController(Request* request, Player* player, SettingsDataPtr settings);
    ~PlaylistsController();

    ResponsePtr getPlaylist();
    ResponsePtr getPlaylists();
    ResponsePtr getPlaylistItems();

    ResponsePtr addPlaylist();
    void removePlaylist();
    void movePlaylist();

    void updatePlaylist();
    void updatePlaylists();
    void clearPlaylist();

    ResponsePtr addItems();

    void moveItemsInPlaylist();
    void copyItemsInPlaylist();

    void moveItemsBetweenPlaylists();
    void copyItemsBetweenPlaylists();

    void removeItems();

    void sortItems();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player, SettingsDataPtr settings);

private:
    std::string validateAndNormalizeItem(const std::string& item);

    Player* player_;
    SettingsDataPtr settings_;

    MSRV_NO_COPY_AND_ASSIGN(PlaylistsController);
};

}
