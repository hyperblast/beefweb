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
      workQueue_(new service_impl_t<Fb2kWorkQueue>)
{
    auto callback = [this] (PlayerEvent ev) { emitEvent(ev); };

    playerEventAdapter_.setCallback(callback);
    playlistEventAdapter_.setCallback(callback);

    initPlaybackModes();
}

PlayerImpl::~PlayerImpl()
{
}

WorkQueue* PlayerImpl::workQueue()
{
    return workQueue_.get_ptr();
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    auto playlist = playlists_->resolve(query.playlist);

    metadb_handle_ptr itemHandle;

    if (!playlistManager_->playlist_get_item_handle(itemHandle, playlist, query.index))
        throw InvalidRequestException("Playlist item index is out of range");

    auto extractor = albumArtManager_->open(
        pfc::list_single_ref_t<metadb_handle_ptr>(itemHandle),
        pfc::list_single_ref_t<GUID>(album_art_ids::cover_front),
        abort_callback_dummy());

    if (extractor.is_empty())
        return boost::make_future<ArtworkResult>(ArtworkResult());

    service_ptr_t<album_art_data> artData;
    if (!extractor->query(album_art_ids::cover_front, artData, abort_callback_dummy()))
        return boost::make_future<ArtworkResult>(ArtworkResult());

    return boost::make_future<ArtworkResult>(ArtworkResult(artData->get_ptr(), artData->get_size()));
}

TitleFormatVector PlayerImpl::compileColumns(const std::vector<std::string>& columns)
{
    TitleFormatVector compiledColumns;
    compiledColumns.reserve(columns.size());

    for (auto& column: columns)
    {
        service_ptr_t<titleformat_object> compiledColumn;

        if (!titleFormatCompiler_->compile(compiledColumn, column.c_str()))
            throw InvalidRequestException("Invalid title format: " + column);

        compiledColumns.emplace_back(std::move(compiledColumn));
    }

    return compiledColumns;
}

}}
