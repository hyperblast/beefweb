#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

PlayerImpl::PlayerImpl()
    : playbackControl_(playback_control::get()),
      playlistManager_(playlist_manager_v4::get()),
      incomingItemFilter_(playlist_incoming_item_filter_v3::get()),
      albumArtManager_(album_art_manager_v3::get()),
      titleFormatCompiler_(titleformat_compiler::get()),
      playlists_(std::make_shared<PlaylistMapping>()),
      playbackOrderOption_(playlistManager_.get_ptr()),
      stopAfterCurrentTrackOption_(playbackControl_.get_ptr())
{
    auto callback = [this](PlayerEvents ev) { emitEvents(ev); };

    playerEventAdapter_.setCallback(callback);
    playlistEventAdapter_.setCallback(callback);
    stopAfterCurrentTrackOption_.setCallback(callback);
    playQueueEventAdapterFactory.get_static_instance().setCallback(callback);

    setPlaybackModeOption(&playbackOrderOption_);
    addOption(&playbackOrderOption_);
    addOption(&stopAfterCurrentTrackOption_);
}

PlayerImpl::~PlayerImpl()
{
    playQueueEventAdapterFactory.get_static_instance().setCallback({});
}

std::unique_ptr<WorkQueue> PlayerImpl::createWorkQueue()
{
    return std::make_unique<Fb2kWorkQueue>();
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
    auto playlist = playlists_->resolve(query.playlist);

    metadb_handle_ptr itemHandle;

    if (!playlistManager_->playlist_get_item_handle(itemHandle, playlist, query.index))
        throw InvalidRequestException("Playlist item index is out of range");

    return fetchArtwork(itemHandle);
}

std::vector<PlayQueueItemInfo> PlayerImpl::getPlayQueue()
{
    std::vector<PlayQueueItemInfo> result;
    pfc::list_t<t_playback_queue_item> items;

    playlistManager_->queue_get_contents(items);

    auto size = items.get_count();
    if (!size)
        return result;

    result.reserve(size);

    for (t_size i = 0; i < size; i++)
    {
        const auto& item = items[i];
        auto playlistId = playlists_->getId(item.m_playlist);
        result.emplace_back(std::move(playlistId), item.m_playlist, item.m_item);
    }

    return result;
}

void PlayerImpl::addToPlayQueue(const PlaylistRef& plref, int32_t itemIndex, int32_t queueIndex)
{
    auto playlist = playlists_->resolve(plref);
    playlistManager_->queue_add_item_playlist(playlist, itemIndex);
}

void PlayerImpl::removeFromPlayQueue(int32_t queueIndex)
{
    bit_array_one mask(queueIndex);
    playlistManager_->queue_remove_mask(mask);
}

void PlayerImpl::removeFromPlayQueue(const PlaylistRef& plref, int32_t itemIndex)
{
    auto playlist = playlists_->resolve(plref);
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

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const metadb_handle_ptr& itemHandle) const
{
    abort_callback_dummy dummyCallback;

    auto extractor = albumArtManager_->open(
        pfc::list_single_ref_t(itemHandle),
        pfc::list_single_ref_t(album_art_ids::cover_front),
        dummyCallback);

    if (extractor.is_empty())
        return boost::make_future<ArtworkResult>(ArtworkResult());

    service_ptr_t<album_art_data> artData;
    if (!extractor->query(album_art_ids::cover_front, artData, dummyCallback))
        return boost::make_future<ArtworkResult>(ArtworkResult());

    return boost::make_future<ArtworkResult>(ArtworkResult(artData->get_ptr(), artData->get_size()));
}

TitleFormatVector PlayerImpl::compileColumns(const std::vector<std::string>& columns)
{
    TitleFormatVector compiledColumns;
    compiledColumns.reserve(columns.size());

    for (auto& column : columns)
    {
        service_ptr_t<titleformat_object> compiledColumn;

        if (!titleFormatCompiler_->compile(compiledColumn, column.c_str()))
            throw InvalidRequestException("Invalid title format: " + column);

        compiledColumns.emplace_back(std::move(compiledColumn));
    }

    return compiledColumns;
}

}
}
