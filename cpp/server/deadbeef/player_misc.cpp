#include "player.hpp"
#include "../log.hpp"

namespace msrv::player_deadbeef {

namespace {

constexpr char outputPluginConfigKey[] = "output_plugin";

inline std::string outputDeviceConfigKey(const std::string& pluginId)
{
    constexpr char suffix[] = "_soundcard";

    std::string key;
    key.reserve(pluginId.length() + sizeof(suffix) - 1);
    key.append(pluginId);
    key.append(suffix);

    return key;
}

struct CheckCardContext
{
    explicit CheckCardContext(const std::string& id) : idToCheck(id) { }

    const std::string& idToCheck;
    bool found = false;
};

void addCardCallback(const char* id, const char* name, void* data)
{
    auto typeInfo = static_cast<OutputTypeInfo*>(data);

    tryCatchLog([&] { typeInfo->devices.emplace_back(id, name); });
}

void checkCardCallback(const char* id, const char*, void* data)
{
    auto context = static_cast<CheckCardContext*>(data);

    if (context->found)
        return;

    if (context->idToCheck == id)
        context->found = true;
}

}

PlayerImpl::PlayerImpl()
{
    setPlaybackModeOption(&playbackModeOption_);
    addOption(&shuffleOption_);
    addOption(&repeatOption_);
    addOption(&stopAfterCurrentTrackOption_);
    addOption(&stopAfterCurrentAlbumOption_);
}

const char* PlayerImpl::name()
{
    return MSRV_PLAYER_DEADBEEF;
}

ColumnsQueryPtr PlayerImpl::createColumnsQuery(const std::vector<std::string>& columns)
{
    return std::make_unique<ColumnsQueryImpl>(columns);
}

std::unique_ptr<WorkQueue> PlayerImpl::createWorkQueue()
{
    return std::make_unique<ThreadWorkQueue>();
}

void PlayerImpl::connect()
{
    {
        ConfigLockGuard lock(configMutex_);
        version_ = ddbApi->conf_get_str_fast("deadbeef_version", "");
    }

    activeOutput_ = getActiveOutput();

    artworkFetcher_ = ArtworkFetcher::createV2();

    if (!artworkFetcher_)
    {
        artworkFetcher_ = ArtworkFetcher::createV1();
    }
}

void PlayerImpl::disconnect()
{
    artworkFetcher_.reset();
}

bool PlayerImpl::checkOutputChanged()
{
    auto output = getActiveOutput();
    if (output == activeOutput_)
        return false;

    activeOutput_ = std::move(output);
    return true;
}

ActiveOutputInfo PlayerImpl::getActiveOutput()
{
    ActiveOutputInfo config;
    ConfigLockGuard lock(configMutex_);

    config.typeId = ddbApi->conf_get_str_fast(outputPluginConfigKey, "alsa");
    config.deviceId = ddbApi->conf_get_str_fast(
        outputDeviceConfigKey(config.typeId).c_str(), MSRV_OUTPUT_DEFAULT_DEVICE_ID);

    return config;
}

std::vector<PlayQueueItemInfo> PlayerImpl::getPlayQueue(ColumnsQuery* query)
{
    auto queryImpl = dynamic_cast<ColumnsQueryImpl*>(query);

    PlaylistLockGuard lock(playlistMutex_);

    playlists_.ensureInitialized();

    std::vector<PlayQueueItemInfo> items;
    auto size = ddbApi->playqueue_get_count();

    if (!size)
    {
        return items;
    }

    items.reserve(size);

    for (auto i = 0; i < size; i++)
    {
        PlaylistItemPtr item(ddbApi->playqueue_get_item(i));
        PlaylistPtr playlist(ddbApi->pl_get_playlist(item.get()));
        auto playlistId = playlists_.getId(playlist.get());
        auto playlistIndex = ddbApi->plt_get_idx(playlist.get());
        auto itemIndex = ddbApi->plt_get_item_idx(playlist.get(), item.get(), PL_MAIN);

        if (queryImpl)
        {
            auto columns = queryImpl->evaluate(playlist.get(), item.get());
            items.emplace_back(playlistId, playlistIndex, itemIndex, std::move(columns));
        }
        else
        {
            items.emplace_back(playlistId, playlistIndex, itemIndex);
        }
    }

    return items;
}

void PlayerImpl::addToPlayQueue(const PlaylistRef& plref, int32_t itemIndex, int32_t queueIndex)
{
    PlaylistLockGuard lock(playlistMutex_);

    auto playlist = playlists_.resolve(plref);
    auto item = resolvePlaylistItem(playlist.get(), itemIndex);

    if (!item)
        throw InvalidRequestException("itemIndex is out of range");

    if (queueIndex < 0 || queueIndex >= ddbApi->playqueue_get_count())
        ddbApi->playqueue_push(item.get());
    else
        ddbApi->playqueue_insert_at(queueIndex, item.get());
}

void PlayerImpl::removeFromPlayQueue(int32_t queueIndex)
{
    PlaylistLockGuard lock(playlistMutex_);

    if (queueIndex < 0 || queueIndex >= ddbApi->playqueue_get_count())
        throw InvalidRequestException("queueIndex is out of range");

    ddbApi->playqueue_remove_nth(queueIndex);
}

void PlayerImpl::removeFromPlayQueue(const PlaylistRef& plref, int32_t itemIndex)
{
    PlaylistLockGuard lock(playlistMutex_);

    auto playlist = playlists_.resolve(plref);
    auto item = resolvePlaylistItem(playlist.get(), itemIndex);

    if (!item)
        throw InvalidRequestException("itemIndex is out of range");

    ddbApi->playqueue_remove(item.get());
}

void PlayerImpl::clearPlayQueue()
{
    ddbApi->playqueue_clear();
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchCurrentArtwork()
{
    if (!artworkFetcher_)
    {
        return boost::make_future(ArtworkResult());
    }

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return boost::make_future(ArtworkResult());

    PlaylistPtr playlist;
    int playlistIndex = ddbApi->streamer_get_current_playlist();
    if (playlistIndex >= 0)
        playlist.reset(ddbApi->plt_get_for_idx(playlistIndex));

    return artworkFetcher_->fetchArtwork(std::move(playlist), std::move(item));
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    if (!artworkFetcher_)
    {
        return boost::make_future(ArtworkResult());
    }

    PlaylistLockGuard lock(playlistMutex_);

    auto playlist = playlists_.resolve(query.playlist);

    auto item = resolvePlaylistItem(playlist.get(), query.index);
    if (!item)
        throw InvalidRequestException("playlist item index is out of range");

    return artworkFetcher_->fetchArtwork(std::move(playlist), std::move(item));
}

OutputsInfo PlayerImpl::getOutputs()
{
    OutputsInfo info;
    info.supportsMultipleOutputTypes = true;

    auto plugins = ddbApi->plug_get_output_list();

    while (*plugins != nullptr)
    {
        auto p = *plugins;

        OutputTypeInfo typeInfo(p->plugin.id, p->plugin.name, {});

        if (p->enum_soundcards)
            p->enum_soundcards(addCardCallback, &typeInfo);
        else
            typeInfo.devices.emplace_back(MSRV_OUTPUT_DEFAULT_DEVICE_ID, MSRV_OUTPUT_DEFAULT_DEVICE_NAME);

        info.types.emplace_back(std::move(typeInfo));

        plugins++;
    }

    info.active = getActiveOutput();
    return info;
}

void PlayerImpl::setOutputDevice(const std::string& typeId, const std::string& deviceId)
{
    auto pluginBase = ddbApi->plug_get_for_id(typeId.c_str());
    if (!pluginBase || pluginBase->type != DB_PLUGIN_OUTPUT)
        throw InvalidRequestException("invalid type id: " + typeId);

    auto plugin = reinterpret_cast<DB_output_t*>(pluginBase);

    if (deviceId != MSRV_OUTPUT_DEFAULT_DEVICE_ID)
    {
        CheckCardContext context(deviceId);

        if (plugin->enum_soundcards)
            plugin->enum_soundcards(checkCardCallback, &context);

        if (!context.found)
            throw InvalidRequestException("invalid device id: " + deviceId);
    }

    ConfigLockGuard lock(configMutex_);

    auto output = getActiveOutput();

    if (output.typeId != typeId)
    {
        // Output plugin is changed
        ddbApi->conf_set_str(outputPluginConfigKey, typeId.c_str());
        ddbApi->conf_set_str(outputDeviceConfigKey(typeId).c_str(), deviceId.c_str());
        ddbApi->sendmessage(DB_EV_REINIT_SOUND, 0, 0, 0);
        return;
    }

    if (output.deviceId == deviceId)
    {
        // No changes
        return;
    }

    // Only output device is changed
    ddbApi->conf_set_str(outputDeviceConfigKey(typeId).c_str(), deviceId.c_str());
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

void PlayerImpl::handleMessage(uint32_t id, uintptr_t, uint32_t p1, uint32_t)
{
    switch (id)
    {
    case DB_EV_CONFIGCHANGED:
    {
        // DB_EV_REINIT_SOUND is not sent when only device is changed.
        // Check previously stored device and emit event if necessary.

        auto events = PlayerEvents::PLAYER_CHANGED;

        if (checkOutputChanged())
            events |= PlayerEvents::OUTPUTS_CHANGED;

        emitEvents(events);
        break;
    }

    case DB_EV_SONGSTARTED:
    case DB_EV_SONGCHANGED:
    case DB_EV_SONGFINISHED:
    case DB_EV_PAUSED:
    case DB_EV_SEEKED:
    case DB_EV_VOLUMECHANGED:
        emitEvents(PlayerEvents::PLAYER_CHANGED);
        break;

    case DB_EV_OUTPUTCHANGED:
        if (checkOutputChanged())
            emitEvents(PlayerEvents::OUTPUTS_CHANGED);
        break;

    case DB_EV_TRACKINFOCHANGED:
        switch (p1)
        {
        case DDB_PLAYLIST_CHANGE_PLAYQUEUE:
            emitEvents(PlayerEvents::PLAY_QUEUE_CHANGED);
            break;
        }
        break;

    case DB_EV_PLAYLISTCHANGED:
        switch (p1)
        {
        case DDB_PLAYLIST_CHANGE_CONTENT:
            // Notify player/queue change for the case when currently played/queued item is reordered or removed
            emitEvents(
                PlayerEvents::PLAYER_CHANGED |
                PlayerEvents::PLAYLIST_ITEMS_CHANGED |
                PlayerEvents::PLAY_QUEUE_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_CREATED:
        case DDB_PLAYLIST_CHANGE_TITLE:
            emitEvents(PlayerEvents::PLAYLIST_SET_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_DELETED:
        case DDB_PLAYLIST_CHANGE_POSITION:
            // Reordering or removing playlists might change playlist index of currently playing/queued item
            emitEvents(
                PlayerEvents::PLAYER_CHANGED |
                PlayerEvents::PLAYLIST_SET_CHANGED |
                PlayerEvents::PLAY_QUEUE_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_PLAYQUEUE:
            emitEvents(PlayerEvents::PLAY_QUEUE_CHANGED);
            break;
        }

        break;
    }
}

}
