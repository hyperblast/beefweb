#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

std::vector<PlaylistInfo> PlayerImpl::getPlaylists()
{
    playlists_.ensureInitialized();

    return std::vector<PlaylistInfo>();
}

std::vector<PlaylistItemInfo> PlayerImpl::getPlaylistItems(PlaylistQuery* query)
{
    return std::vector<PlaylistItemInfo>();
}

void PlayerImpl::addPlaylist(int32_t index, const std::string& title)
{
    playlists_.ensureInitialized();

    playlistManager_->create_playlist(
        title.data(),
        title.length(),
        index >= 0 ? index : pfc_infinite);
}

void PlayerImpl::removePlaylist(const PlaylistRef& playlist)
{
    playlistManager_->remove_playlist_switch(playlists_.resolve(playlist));
}

void PlayerImpl::movePlaylist(const PlaylistRef& playlist, int32_t index)
{
    auto count = playlistManager_->get_playlist_count();
    auto oldIndex = playlists_.resolve(playlist);
    auto newIndex = static_cast<t_size>(index);

    if (newIndex == oldIndex)
        return;

    std::vector<t_size> indexes;
    indexes.reserve(count);
    for (t_size i = 0; i < count; i++)
        indexes.push_back(i);

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
    const PlaylistRef& playlist,
    const std::vector<int32_t>& itemIndexes)
{
}

void PlayerImpl::sortPlaylist(
    const PlaylistRef& plref,
    const std::string& expression,
    bool descending)
{
}

void PlayerImpl::sortPlaylistRandom(const PlaylistRef& plref)
{
}

PlaylistQueryPtr PlayerImpl::createPlaylistQuery(
    const PlaylistRef& playlist,
    const Range& range,
    const std::vector<std::string>& columns)
{
    return PlaylistQueryPtr();
}

}}
