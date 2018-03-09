#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

namespace {

class PlaylistQueryImpl : public PlaylistQuery
{
public:
    PlaylistQueryImpl(
        const PlaylistRef& plrefVal,
        const Range& rangeVal,
        TitleFormatVector columnsVal)
        : plref(plrefVal),
          range(rangeVal),
          columns(std::move(columnsVal))
    {
    }

    PlaylistRef plref;
    Range range;
    TitleFormatVector columns;
};

std::vector<t_size> createIndexesVector(t_size count)
{
    std::vector<t_size> indexes;
    indexes.reserve(count);

    for (t_size i = 0; i < count; i++)
        indexes.push_back(i);

    return indexes;
}

inline t_size clampIndex(int32_t index, t_size count, t_size fallback)
{
    return index >= 0 && static_cast<t_size>(index) < count
        ? index
        : fallback;
}

}

std::vector<PlaylistInfo> PlayerImpl::getPlaylists()
{
    playlists_.ensureInitialized();

    auto count = playlistManager_->get_playlist_count();
    auto current = playlistManager_->get_active_playlist();

    std::vector<PlaylistInfo> playlists;
    playlists.reserve(count);

    pfc::string8 nameBuffer;

    for (t_size i = 0; i < count; i++)
    {
        PlaylistInfo info;

        info.id = playlists_.getId(i);
        info.index = i;
        info.isCurrent = i == current;
        info.itemCount = playlistManager_->playlist_get_item_count(i);

        if (playlistManager_->playlist_get_name(i, nameBuffer))
            info.title.assign(nameBuffer.get_ptr(), nameBuffer.get_length());

        info.totalTime = 0.0;

        playlists.emplace_back(std::move(info));
    }

    return playlists;
}

std::vector<PlaylistItemInfo> PlayerImpl::getPlaylistItems(PlaylistQuery* queryPtr)
{
    auto query = static_cast<PlaylistQueryImpl*>(queryPtr);
    auto playlist = playlists_.resolve(query->plref);

    auto start = static_cast<t_size>(query->range.offset);

    auto end = std::min(
        static_cast<t_size>(query->range.endOffset()),
        playlistManager_->playlist_get_item_count(playlist));

    std::vector<PlaylistItemInfo> result;
    pfc::string8 buffer;

    for (t_size item = start; item < end; item++)
    {
        PlaylistItemInfo info;
        info.columns.reserve(query->columns.size());

        for (auto& compiledColumn : query->columns)
        {
            playlistManager_->playlist_item_format_title(
                playlist,
                item,
                nullptr,
                buffer,
                compiledColumn,
                nullptr,
                playback_control::display_level_titles);

            info.columns.emplace_back(buffer.get_ptr(), buffer.get_length());
        }

        result.emplace_back(std::move(info));
    }

    return result;
}

void PlayerImpl::addPlaylist(int32_t index, const std::string& title)
{
    playlists_.ensureInitialized();

    playlistManager_->create_playlist(
        title.data(),
        title.length(),
        clampIndex(index, playlistManager_->get_playlist_count(), pfc_infinite));
}

void PlayerImpl::removePlaylist(const PlaylistRef& playlist)
{
    playlistManager_->remove_playlist_switch(playlists_.resolve(playlist));
}

void PlayerImpl::movePlaylist(const PlaylistRef& playlist, int32_t index)
{
    auto count = playlistManager_->get_playlist_count();
    auto oldIndex = playlists_.resolve(playlist);
    auto newIndex = clampIndex(index, count, count - 1);

    if (newIndex == oldIndex)
        return;

    auto indexes = createIndexesVector(count);
    pfc::create_move_item_permutation(indexes.data(), count, oldIndex, newIndex);
    playlistManager_->reorder(indexes.data(), count);
}

void PlayerImpl::clearPlaylist(const PlaylistRef& playlist)
{
    playlistManager_->playlist_clear(playlists_.resolve(playlist));
}

void PlayerImpl::setCurrentPlaylist(const PlaylistRef& playlist)
{
    playlistManager_->set_active_playlist(playlists_.resolve(playlist));
}

void PlayerImpl::setPlaylistTitle(const PlaylistRef& playlist, const std::string& title)
{
    playlistManager_->playlist_rename(playlists_.resolve(playlist), title.data(), title.length());
}

boost::unique_future<void> PlayerImpl::addPlaylistItems(
    const PlaylistRef& playlist,
    const std::vector<std::string>& items,
    int32_t targetIndex)
{
    throw InvalidRequestException("Not implemented");
}

void PlayerImpl::copyPlaylistItems(
    const PlaylistRef& sourcePlaylist,
    const PlaylistRef& targetPlaylist,
    const std::vector<int32_t>& sourceItemIndexes,
    int32_t targetIndex)
{
}

void PlayerImpl::movePlaylistItems(
    const PlaylistRef& sourcePlaylist,
    const PlaylistRef& targetPlaylist,
    const std::vector<int32_t>& sourceItemIndexes,
    int32_t targetIndex)
{
}

void PlayerImpl::removePlaylistItems(
    const PlaylistRef& plref,
    const std::vector<int32_t>& itemIndexes)
{
    auto playlist = playlists_.resolve(plref);
    auto count = playlistManager_->playlist_get_item_count(playlist);

    pfc::bit_array_flatIndexList items;

    for (auto index : itemIndexes)
    {
        if (index >= 0 && static_cast<t_size>(index) < count)
            items.add(index);
    }

    items.presort();

    playlistManager_->playlist_remove_items(playlist, items);
}

void PlayerImpl::sortPlaylist(
    const PlaylistRef& plref,
    const std::string& expression,
    bool descending)
{
    playlistManager_->playlist_sort_by_format(playlists_.resolve(plref), expression.c_str(), false);
    // TODO: descending sort
}

void PlayerImpl::sortPlaylistRandom(const PlaylistRef& plref)
{
    playlistManager_->playlist_sort_by_format(playlists_.resolve(plref), nullptr, false);
}

PlaylistQueryPtr PlayerImpl::createPlaylistQuery(
    const PlaylistRef& playlist,
    const Range& range,
    const std::vector<std::string>& columns)
{
    return std::make_unique<PlaylistQueryImpl>(playlist, range, compileColumns(columns));
}

}}
