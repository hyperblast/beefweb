#include "query_controller.hpp"
#include "router.hpp"
#include "core_types_parsers.hpp"
#include "core_types_json.hpp"
#include "player_api_json.hpp"
#include "player_api_parsers.hpp"

namespace msrv {

namespace {

constexpr char PLAYER_KEY[] = "player";
constexpr char PLAYLISTS_KEY[] = "playlists";
constexpr char PLAYLIST_ITEMS_KEY[] = "playlistItems";

}

QueryController::QueryController(Request* request, Player* player, EventDispatcher* dispatcher)
    : ControllerBase(request), player_(player), dispatcher_(dispatcher)
{
}

QueryController::~QueryController()
{
}

ResponsePtr QueryController::query()
{
    auto mask = readEventMask();
    createQueries(mask);
    return Response::json(stateToJson(mask));
}

ResponsePtr QueryController::getEvents()
{
    auto mask = readEventMask();
    listenForEvents(mask);

    return Response::eventStream([this]
    {
        return eventsToJson(listener_->readEvents());
    });
}

ResponsePtr QueryController::getUpdates()
{
    auto mask = readEventMask();
    createQueries(mask);
    listenForEvents(mask);

    return Response::eventStream([this]
    {
        return stateToJson(listener_->readEvents());
    });
}

EventSet QueryController::readEventMask()
{
    EventSet mask;

    if (optionalParam<bool>(PLAYER_KEY, false))
        mask.set(PlayerEvent::PLAYER_CHANGED);

    if (optionalParam<bool>(PLAYLISTS_KEY, false))
        mask.set(PlayerEvent::PLAYLIST_SET_CHANGED);

    if (optionalParam<bool>(PLAYLIST_ITEMS_KEY, false))
        mask.set(PlayerEvent::PLAYLIST_ITEMS_CHANGED);

    if (!mask.any())
        throw InvalidRequestException("at least one key is required");

    return mask;
}

void QueryController::createQueries(const EventSet& events)
{
    if (events.test(PlayerEvent::PLAYER_CHANGED))
    {
        if (auto columns = optionalParam<std::vector<std::string>>("trcolumns"))
            trackQuery_ = player_->createTrackQuery(*columns);
    }

    if (events.test(PlayerEvent::PLAYLIST_ITEMS_CHANGED))
    {
        playlistQuery_ = player_->createPlaylistQuery(
            param<PlaylistRef>("plref"),
            param<Range>("plrange"),
            param<std::vector<std::string>>("plcolumns"));
    }
}

void QueryController::listenForEvents(const EventSet& events)
{
    listener_ = dispatcher_->createListener(events);
}

Json QueryController::eventsToJson(const EventSet& changeSet)
{
    Json obj = Json::object();

    if (changeSet.test(PlayerEvent::PLAYER_CHANGED))
        obj[PLAYER_KEY] = true;

    if (changeSet.test(PlayerEvent::PLAYLIST_SET_CHANGED))
        obj[PLAYLISTS_KEY] = true;

    if (changeSet.test(PlayerEvent::PLAYLIST_ITEMS_CHANGED))
        obj[PLAYLIST_ITEMS_KEY] = true;

    return obj;
}

Json QueryController::stateToJson(const EventSet& changeSet)
{
    Json obj = Json::object();

    if (changeSet.test(PlayerEvent::PLAYER_CHANGED))
        obj[PLAYER_KEY] = *player_->queryPlayerState(trackQuery_.get());

    if (changeSet.test(PlayerEvent::PLAYLIST_SET_CHANGED))
        obj[PLAYLISTS_KEY] = player_->getPlaylists();

    if (changeSet.test(PlayerEvent::PLAYLIST_ITEMS_CHANGED))
        obj[PLAYLIST_ITEMS_KEY] = player_->getPlaylistItems(playlistQuery_.get());

    return obj;
}

void QueryController::defineRoutes(Router* router, WorkQueue* workQueue, Player* player, EventDispatcher* dispatcher)
{
    auto routes = router->defineRoutes<QueryController>();

    routes.createWith([=](Request* request)
    {
        return new QueryController(request, player, dispatcher);
    });

    routes.useWorkQueue(workQueue);

    routes.setPrefix("api/query");

    routes.get("", &QueryController::query);
    routes.get("events", &QueryController::getEvents);
    routes.get("updates", &QueryController::getUpdates);
}

}
