#pragma once

#include "defines.hpp"
#include "controller.hpp"
#include "settings.hpp"

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
    void updatePlaylists();
    void clearPlaylist();

    ResponsePtr addItems();

    void moveItemsInPlaylist();
    void copyItemsInPlaylist();

    void moveItemsBetweenPlaylists();
    void copyItemsBetweenPlaylists();

    void removeItems();

    void sortItems();

    static void defineRoutes(Router* router, WorkQueue* workQueue, Player* player, SettingsStore* store);

private:
    std::string validateAndNormalizeItem(const SettingsData& settings, const std::string& item);

    Player* player_;
    SettingsStore* store_;

    MSRV_NO_COPY_AND_ASSIGN(PlaylistsController);
};

}
