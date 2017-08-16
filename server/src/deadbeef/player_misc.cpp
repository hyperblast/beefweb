#include "player.hpp"
#include "../log.hpp"

namespace msrv {
namespace deadbeef_plugin {

struct ArtworkCallbackState
{
    Path cachePath;
    boost::promise<ArtworkResult> resultPromise;
};

PlayerImpl::PlayerImpl()
    : artworkPlugin_(nullptr)
{
    addOption(&orderOption_);
    addOption(&loopOption_);
}

PlayerImpl::~PlayerImpl()
{
}

void PlayerImpl::connect()
{
    auto artwork = ddbApi->plug_get_for_id("artwork");

    if (artwork && PLUG_TEST_COMPAT(artwork, 1, DDB_ARTWORK_VERSION))
        artworkPlugin_ = reinterpret_cast<DB_artwork_plugin_t*>(artwork);
}

void PlayerImpl::disconnect()
{
    if (artworkPlugin_)
        artworkPlugin_->reset(0);
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    if (!artworkPlugin_)
        return boost::make_future(ArtworkResult());

    logDebug("artwork query: file = %s; artist = %s; album = %s",
             query.file.c_str(), query.artist.c_str(), query.album.c_str());

    std::unique_ptr<ArtworkCallbackState> state(new ArtworkCallbackState());
    auto future = state->resultPromise.get_future();

    Path sourcePath = pathFromUtf8(query.file);
    auto sourcePathStr = !sourcePath.empty() ? sourcePath.c_str() : nullptr;
    auto artist = !query.artist.empty() ? query.artist.c_str() : nullptr;
    auto album = !query.album.empty() ? query.album.c_str() : nullptr;

    char cachePath[PATH_MAX];
    artworkPlugin_->make_cache_path2(
        cachePath, sizeof(cachePath), sourcePathStr, album, artist, -1);
    logDebug("artwork cached path: %s", cachePath);
    state->cachePath = Path(cachePath);

    ArtworkCallbackState* statePtr = state.release();

    MallocPtr<char> artworkPath(
        artworkPlugin_->get_album_art(sourcePathStr, artist, album, -1, artworkCallback, statePtr));

    if (artworkPath)
    {
        state.reset(statePtr);
        logDebug("artwork found in cache: %s", artworkPath.get());
        return boost::make_future(ArtworkResult(std::string(artworkPath.get())));
    }

    return future;
}

void PlayerImpl::artworkCallback(const char*, const char*, const char*, void* data)
{
    auto state = reinterpret_cast<ArtworkCallbackState*>(data);

    tryCatchLog([&]
    {
        state->resultPromise.set_value(pathToUtf8(state->cachePath));
    });

    tryCatchLog([&] { delete state; });
}

void PlayerImpl::handleMessage(uint32_t id, uintptr_t, uint32_t p1, uint32_t)
{
    switch (id)
    {
    case DB_EV_CONFIGCHANGED:
    case DB_EV_SONGSTARTED:
    case DB_EV_SONGCHANGED:
    case DB_EV_SONGFINISHED:
    case DB_EV_PAUSED:
    case DB_EV_SEEKED:
    case DB_EV_VOLUMECHANGED:
        emitEvent(PlayerEvent::PLAYER_CHANGED);
        break;

    case DB_EV_PLAYLISTCHANGED:
        switch (p1)
        {
        case DDB_PLAYLIST_CHANGE_CONTENT:
            emitEvent(PlayerEvent::PLAYLIST_ITEMS_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_CREATED:
        case DDB_PLAYLIST_CHANGE_DELETED:
        case DDB_PLAYLIST_CHANGE_TITLE:
        case DDB_PLAYLIST_CHANGE_POSITION:
            emitEvent(PlayerEvent::PLAYLIST_SET_CHANGED);
            break;
        }

        break;
    }
}

}}
