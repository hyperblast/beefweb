#include "player.hpp"
#include "log.hpp"

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

struct FindCardContext
{
    explicit FindCardContext(const std::string& id) : idToFind(id) { }

    const std::string& idToFind;
    bool found = false;
};

void addCardCallback(const char* id, const char* name, void* data)
{
    auto typeInfo = static_cast<OutputTypeInfo*>(data);

    tryCatchLog([&] { typeInfo->devices.emplace_back(id, name); });
}

void findCardCallback(const char* id, const char*, void* data)
{
    auto context = static_cast<FindCardContext*>(data);

    if (context->found)
        return;

    if (context->idToFind == id)
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
    return std::make_unique<ThreadWorkQueue>(MSRV_THREAD_NAME("control"));
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
    config.deviceId = ddbApi->conf_get_str_fast(outputDeviceConfigKey(config.typeId).c_str(), default_output::deviceId);

    return config;
}

std::vector<PlayQueueItemInfo> PlayerImpl::getPlayQueue(ColumnsQuery* query)
{
    auto queryImpl = dynamic_cast<ColumnsQueryImpl*>(query);

    PlaylistLockGuard lock(playlistMutex_);

    std::vector<PlayQueueItemInfo> items;
    auto count = ddbApi->playqueue_get_count();

    if (!count)
        return items;

    items.reserve(count);

    const auto& playlistIds = playlists_.playlistIds();

    for (auto queueIndex = 0; queueIndex < count; queueIndex++)
    {
        PlaylistItemPtr item(ddbApi->playqueue_get_item(queueIndex));
        PlaylistPtr playlist(ddbApi->pl_get_playlist(item.get()));
        auto playlistIndex = ddbApi->plt_get_idx(playlist.get());
        const auto& playlistId = playlistIds[playlistIndex];
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

    auto playlist = playlists_.getPlaylist(plref);
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

    auto playlist = playlists_.getPlaylist(plref);
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

    PlaylistItemPtr item(ddbApi->streamer_get_playing_track());
    if (!item)
        return boost::make_future(ArtworkResult());

    PlaylistLockGuard lock(playlistMutex_);

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

    auto playlist = playlists_.getPlaylist(query.playlist);

    auto item = resolvePlaylistItem(playlist.get(), query.index);
    if (!item)
        throw InvalidRequestException("playlist item index is out of range");

    return artworkFetcher_->fetchArtwork(std::move(playlist), std::move(item));
}

OutputsInfo PlayerImpl::getOutputs()
{
    OutputsInfo info;
    info.supportsMultipleOutputTypes = true;

    for (auto plist = ddbApi->plug_get_output_list(); *plist; plist++)
    {
        auto p = *plist;

        OutputTypeInfo typeInfo(p->plugin.id, p->plugin.name, {});

        if (p->enum_soundcards)
            p->enum_soundcards(addCardCallback, &typeInfo);
        else
            typeInfo.devices.emplace_back(default_output::deviceId, default_output::deviceName);

        info.types.emplace_back(std::move(typeInfo));
    }

    info.active = getActiveOutput();
    return info;
}

void PlayerImpl::setOutputDevice(const std::string& typeId, const std::string& deviceId)
{
    DB_output_t* plugin;

    if (typeId.empty())
    {
        plugin = ddbApi->get_output();
    }
    else
    {
        auto plug = ddbApi->plug_get_for_id(typeId.c_str());
        if (!plug || plug->type != DB_PLUGIN_OUTPUT)
            throw InvalidRequestException("invalid type id: " + typeId);
        plugin = reinterpret_cast<DB_output_t*>(plug);
    }

    FindCardContext context(deviceId);

    if (plugin->enum_soundcards)
        plugin->enum_soundcards(findCardCallback, &context);
    else
        context.found = deviceId == default_output::deviceId;

    if (!context.found)
        throw InvalidRequestException("invalid device id: " + deviceId);

    ConfigLockGuard lock(configMutex_);

    auto output = getActiveOutput();

    if (!typeId.empty() && output.typeId != typeId)
    {
        // Output plugin is changed
        ddbApi->conf_set_str(outputPluginConfigKey, typeId.c_str());

        if (plugin->enum_soundcards)
            ddbApi->conf_set_str(outputDeviceConfigKey(typeId).c_str(), deviceId.c_str());

        ddbApi->sendmessage(DB_EV_REINIT_SOUND, 0, 0, 0);
        return;
    }

    if (output.deviceId == deviceId || !plugin->enum_soundcards)
    {
        // No changes
        return;
    }

    // Only output device is changed
    ddbApi->conf_set_str(outputDeviceConfigKey(output.typeId).c_str(), deviceId.c_str());
    ddbApi->sendmessage(DB_EV_CONFIGCHANGED, 0, 0, 0);
}

void PlayerImpl::handleMessage(uint32_t id, uintptr_t, uint32_t p1, uint32_t)
{
    switch (id)
    {
    case DB_EV_CONFIGCHANGED:
        // DB_EV_REINIT_SOUND is not sent when only device is changed.
        // Check previously stored device and emit event if necessary.
        emitEvents(
            PlayerEvents::PLAYER_CHANGED |
            (checkOutputChanged() ? PlayerEvents::OUTPUTS_CHANGED : PlayerEvents::NONE));
        break;

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

        case DDB_PLAYLIST_CHANGE_TITLE:
            emitEvents(PlayerEvents::PLAYLIST_SET_CHANGED);
            break;

        case DDB_PLAYLIST_CHANGE_CREATED:
        case DDB_PLAYLIST_CHANGE_DELETED:
        case DDB_PLAYLIST_CHANGE_POSITION:
            {
                PlaylistLockGuard lock(playlistMutex_);
                if (addingPlaylist_)
                {
                    addingPlaylist_ = false;
                }
                else
                {
                    logDebug("invalidating playlists");
                    playlists_.invalidate();
                }
            }

            // Playlists might change playlist index of currently playing/queued item
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
