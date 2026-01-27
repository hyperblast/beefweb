#include "project_info.hpp"
#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

PlayerImpl::PlayerImpl()
    : playbackControl_(playback_control_v3::get()),
      playlistManager_(playlist_manager_v4::get()),
      outputManager_(output_manager_v2::get()),
      incomingItemFilter_(playlist_incoming_item_filter_v3::get()),
      albumArtManager_(album_art_manager_v3::get()),
      titleFormatCompiler_(titleformat_compiler::get()),
      playlists_(std::make_shared<PlaylistMappingImpl>()),
      playbackOrderOption_(playlistManager_.get_ptr()),
      stopAfterCurrentTrackOption_(playbackControl_.get_ptr())
{
    auto callback = [this](PlayerEvents ev) { emitEvents(ev); };

    playerEventAdapter_.setCallback(callback);
    playlistEventAdapter_.setCallback(callback);
    stopAfterCurrentTrackOption_.setCallback(callback);
    outputEventAdapter_.setCallback(callback);
    playQueueEventAdapterFactory.get_static_instance().setCallback(callback);

    playlistEventAdapter_.setPlaylistMapping(playlists_);

    setPlaybackModeOption(&playbackOrderOption_);
    addOption(&playbackOrderOption_);
    addOption(&stopAfterCurrentTrackOption_);
}

PlayerImpl::~PlayerImpl()
{
    playQueueEventAdapterFactory.get_static_instance().setCallback({});
}

const char* PlayerImpl::name()
{
    return MSRV_PLAYER_FOOBAR2000;
}

std::unique_ptr<WorkQueue> PlayerImpl::createWorkQueue()
{
    return std::make_unique<Fb2kWorkQueue>();
}

ColumnsQueryPtr PlayerImpl::createColumnsQuery(const std::vector<std::string>& columns)
{
    return std::make_unique<ColumnsQueryImpl>(compileColumns(columns));
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchCurrentArtwork()
{
    metadb_handle_ptr itemHandle;

    if (playbackControl_->get_now_playing(itemHandle))
        return fetchArtwork(itemHandle);

    return boost::make_future(ArtworkResult());
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    auto playlist = playlists_->getIndex(query.playlist);

    metadb_handle_ptr itemHandle;

    if (!playlistManager_->playlist_get_item_handle(itemHandle, playlist, query.index))
        throw InvalidRequestException("playlist item index is out of range");

    return fetchArtwork(itemHandle);
}

std::vector<PlayQueueItemInfo> PlayerImpl::getPlayQueue(ColumnsQuery* query)
{
    auto queryImpl = dynamic_cast<ColumnsQueryImpl*>(query);

    std::vector<PlayQueueItemInfo> result;
    pfc::list_t<t_playback_queue_item> items;

    playlistManager_->queue_get_contents(items);

    auto size = items.get_count();
    if (!size)
        return result;

    result.reserve(size);

    pfc::string8 buffer;

    for (t_size i = 0; i < size; i++)
    {
        const auto& item = items[i];
        auto playlistId = playlists_->getId(static_cast<int32_t>(item.m_playlist));

        if (queryImpl)
        {
            auto columns = evaluatePlaylistColumns(item.m_playlist, item.m_item, queryImpl->columns, &buffer);
            result.emplace_back(std::move(playlistId), static_cast<int32_t>(item.m_playlist), static_cast<int32_t>(item.m_item), std::move(columns));
        }
        else
        {
            result.emplace_back(std::move(playlistId), static_cast<int32_t>(item.m_playlist), static_cast<int32_t>(item.m_item));
        }
    }

    return result;
}

void PlayerImpl::addToPlayQueue(const PlaylistRef& plref, int32_t itemIndex, int32_t queueIndex)
{
    auto playlist = playlists_->getIndex(plref);
    playlistManager_->queue_add_item_playlist(playlist, itemIndex);
}

void PlayerImpl::removeFromPlayQueue(int32_t queueIndex)
{
    bit_array_one mask(queueIndex);
    playlistManager_->queue_remove_mask(mask);
}

void PlayerImpl::removeFromPlayQueue(const PlaylistRef& plref, int32_t itemIndex)
{
    auto playlist = playlists_->getIndex(plref);
    metadb_handle_ptr handle;

    if (itemIndex < 0 || !playlistManager_->playlist_get_item_handle(handle, playlist, static_cast<t_size>(itemIndex)))
        throw InvalidRequestException("itemIndex is out of range");

    t_playback_queue_item item;
    item.m_handle = handle;
    item.m_playlist = playlist;
    item.m_item = itemIndex;

    auto queueIndex = playlistManager_->queue_find_index(item);
    if (queueIndex == pfc::infinite_size)
        return;

    bit_array_one mask(queueIndex);
    playlistManager_->queue_remove_mask(mask);
}

void PlayerImpl::clearPlayQueue()
{
    playlistManager_->queue_flush();
}

OutputsInfo PlayerImpl::getOutputs()
{
    OutputTypeInfo outputType{default_output::typeId, default_output::typeName, {}};

    outputManager_->listDevices([&outputType](const char* name, const GUID& outputGuid, const GUID& deviceGuid) {
        outputType.devices.emplace_back(doubleGuidToString(outputGuid, deviceGuid), name);
    });

    auto config = outputManager_->getCoreConfig();

    OutputsInfo result;
    result.types.emplace_back(std::move(outputType));
    result.active = ActiveOutputInfo(default_output::typeId, doubleGuidToString(config.m_output, config.m_device));
    return result;
}

void PlayerImpl::setOutputDevice(const std::string& typeId, const std::string& deviceId)
{
    if (!typeId.empty() && typeId != default_output::typeId)
        throw InvalidRequestException("invalid output type id: " + typeId);

    auto deviceRef = tryParseDoubleGuid(deviceId.c_str());
    if (!deviceRef)
        throw InvalidRequestException("invalid output device id: " + deviceId);

    outputManager_->setCoreConfigDevice(deviceRef->first, deviceRef->second);
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const metadb_handle_ptr& itemHandle) const
{
    abort_callback_dummy dummyCallback;
    std::string operation;

    try
    {
        operation = "albumArtManager_->open";

        auto extractor = albumArtManager_->open(
            pfc::list_single_ref_t(itemHandle),
            pfc::list_single_ref_t(album_art_ids::cover_front),
            dummyCallback);

        if (extractor.is_empty())
            return boost::make_future<ArtworkResult>(ArtworkResult());

        operation = "extractor->query";

        service_ptr_t<album_art_data> artData;
        if (!extractor->query(album_art_ids::cover_front, artData, dummyCallback))
            return boost::make_future<ArtworkResult>(ArtworkResult());

        return boost::make_future<ArtworkResult>(ArtworkResult(artData->get_ptr(), artData->get_size()));
    }
    catch (std::exception& ex)
    {
        throw InvalidRequestException(operation);
    }
}

TitleFormatVector PlayerImpl::compileColumns(const std::vector<std::string>& columns)
{
    TitleFormatVector compiledColumns;
    compiledColumns.reserve(columns.size());

    for (auto& column : columns)
    {
        service_ptr_t<titleformat_object> compiledColumn;

        if (!titleFormatCompiler_->compile(compiledColumn, column.c_str()))
            throw InvalidRequestException("invalid format expression: " + column);

        compiledColumns.emplace_back(std::move(compiledColumn));
    }

    return compiledColumns;
}

}
}
