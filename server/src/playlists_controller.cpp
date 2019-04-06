#include "playlists_controller.hpp"
#include "file_system.hpp"
#include "settings.hpp"
#include "log.hpp"
#include "router.hpp"
#include "core_types_parsers.hpp"
#include "core_types_json.hpp"
#include "player_api.hpp"
#include "player_api_json.hpp"
#include "player_api_parsers.hpp"

#include <boost/algorithm/string.hpp>
#include <regex>

namespace msrv {

namespace {

bool isUrl(const std::string& input)
{
    static const std::regex pattern("^[a-z]+:\\/\\/.*$", std::regex::ECMAScript);
    return std::regex_match(input, pattern);
}

boost::optional<std::string> stripFileScheme(const std::string& url)
{
    static const char FILE_SCHEME[] = "file://";

    if (boost::starts_with(url, FILE_SCHEME))
        return url.substr(sizeof(FILE_SCHEME) - 1);

    return boost::none;
}

}

PlaylistsController::PlaylistsController(Request* request, Player* player, SettingsStore* store)
    : ControllerBase(request), player_(player), store_(store)
{
}

PlaylistsController::~PlaylistsController()
{
}

ResponsePtr PlaylistsController::getPlaylists()
{
    return Response::json({{ "playlists", player_->getPlaylists() }});
}

ResponsePtr PlaylistsController::getPlaylistItems()
{
    auto plref = param<PlaylistRef>("plref");
    auto range = param<Range>("range");
    auto columns = param<std::vector<std::string>>("columns");

    auto query = player_->createPlaylistQuery(plref, range, columns);
    auto items = player_->getPlaylistItems(query.get());

    return Response::json({{ "playlistItems", items }});
}

void PlaylistsController::addPlaylist()
{
    auto index = optionalParam<int32_t>("index", -1);
    auto title = optionalParam<std::string>("title", "New playlist");

    player_->addPlaylist(index, title);
}

void PlaylistsController::removePlaylist()
{
    player_->removePlaylist(param<PlaylistRef>("plref"));
}

void PlaylistsController::movePlaylist()
{
    player_->movePlaylist(param<PlaylistRef>("plref"), param<int32_t>("index"));
}

void PlaylistsController::updatePlaylist()
{
    auto plref = param<PlaylistRef>("plref");

    if (auto title = optionalParam<std::string>("title"))
        player_->setPlaylistTitle(plref, *title);
}

void PlaylistsController::updatePlaylists()
{
    if (auto current = optionalParam<PlaylistRef>("current"))
        player_->setCurrentPlaylist(*current);
}

void PlaylistsController::clearPlaylist()
{
    player_->clearPlaylist(param<PlaylistRef>("plref"));
}

std::string PlaylistsController::validateAndNormalizeItem(const SettingsData& settings, const std::string& item)
{
    std::string path;

    if (isUrl(item))
    {
        if (auto fileUrlPath = stripFileScheme(item))
            path = *fileUrlPath;
        else
            return item;
    }
    else
        path = item;

    path = pathToUtf8(pathFromUtf8(path).lexically_normal().make_preferred());

    if (settings.isAllowedPath(path))
        return path;

    request()->response = Response::error(HttpStatus::S_403_FORBIDDEN, "item is not under allowed path: " + item);
    request()->setProcessed();

    throw InvalidRequestException();
}

ResponsePtr PlaylistsController::addItems()
{
    auto plref = param<PlaylistRef>("plref");
    auto items = param<std::vector<std::string>>("items");
    std::vector<std::string> normalizedItems;
    auto targetIndex = optionalParam<int32_t>("index", -1);

    auto settings = store_->settings();

    for (auto& item : items)
        normalizedItems.emplace_back(validateAndNormalizeItem(*settings, item));

    auto addCompleted = player_->addPlaylistItems(plref, normalizedItems, targetIndex);

    if (optionalParam<bool>("async", false))
    {
        addCompleted.then(boost::launch::sync, [] (boost::unique_future<void> result)
        {
            tryCatchLog([&] { result.get(); });
        });

        return Response::custom(HttpStatus::S_202_ACCEPTED);
    }
    else
    {
        auto responseFuture = addCompleted.then(
            boost::launch::sync, [] (boost::unique_future<void> result)
            {
                result.get();
                return ResponsePtr(Response::ok());
            });

        return Response::async(std::move(responseFuture));
    }
}

void PlaylistsController::moveItemsInPlaylist()
{
    auto plref = param<PlaylistRef>("plref");

    player_->movePlaylistItems(
        plref,
        plref,
        param<std::vector<int32_t>>("items"),
        optionalParam<int32_t>("targetIndex", -1));
}

void PlaylistsController::copyItemsInPlaylist()
{
    auto plref = param<PlaylistRef>("plref");

    player_->copyPlaylistItems(
        plref,
        plref,
        param<std::vector<int32_t>>("items"),
        optionalParam<int32_t>("targetIndex", -1));
}

void PlaylistsController::moveItemsBetweenPlaylists()
{
    player_->movePlaylistItems(
        param<PlaylistRef>("plref"),
        param<PlaylistRef>("targetPlref"),
        param<std::vector<int32_t>>("items"),
        optionalParam<int32_t>("targetIndex", -1));
}

void PlaylistsController::copyItemsBetweenPlaylists()
{
    player_->copyPlaylistItems(
        param<PlaylistRef>("plref"),
        param<PlaylistRef>("targetPlref"),
        param<std::vector<int32_t>>("items"),
        optionalParam<int32_t>("targetIndex", -1));
}

void PlaylistsController::removeItems()
{
    player_->removePlaylistItems(
        param<PlaylistRef>("plref"),
        param<std::vector<int32_t>>("items"));
}

void PlaylistsController::sortItems()
{
    auto playlist = param<PlaylistRef>("plref");

    if (optionalParam<bool>("random", false))
    {
        player_->sortPlaylistRandom(playlist);
        return;
    }

    player_->sortPlaylist(
        playlist,
        param<std::string>("by"),
        optionalParam<bool>("desc", false));
}

void PlaylistsController::defineRoutes(Router* router, WorkQueue* workQueue, Player* player, SettingsStore* store)
{
    auto routes = router->defineRoutes<PlaylistsController>();

    routes.createWith([=](Request* request)
    {
        return new PlaylistsController(request, player, store);
    });

    routes.useWorkQueue(workQueue);

    routes.setPrefix("api/playlists");

    routes.get("", &PlaylistsController::getPlaylists);
    routes.post("", &PlaylistsController::updatePlaylists);

    routes.post("add", &PlaylistsController::addPlaylist);
    routes.post("remove/:plref", &PlaylistsController::removePlaylist);
    routes.post("move/:plref/:index", &PlaylistsController::movePlaylist);

    routes.post(":plref", &PlaylistsController::updatePlaylist);
    routes.post(":plref/clear", &PlaylistsController::clearPlaylist);

    routes.post(
        ":plref/items/add",
        ControllerAction<PlaylistsController>(&PlaylistsController::addItems));

    routes.post(":plref/items/move", &PlaylistsController::moveItemsInPlaylist);
    routes.post(":plref/items/copy", &PlaylistsController::copyItemsInPlaylist);
    routes.post(":plref/items/remove", &PlaylistsController::removeItems);
    routes.post(":plref/items/sort", &PlaylistsController::sortItems);

    routes.post(":plref/:targetPlref/items/move", &PlaylistsController::moveItemsBetweenPlaylists);
    routes.post(":plref/:targetPlref/items/copy", &PlaylistsController::copyItemsBetweenPlaylists);

    routes.get(":plref/items/:range", &PlaylistsController::getPlaylistItems);
}

}
