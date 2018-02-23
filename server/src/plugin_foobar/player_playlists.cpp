#include "player.hpp"

namespace msrv {
namespace plugin_foobar {

std::vector<PlaylistInfo> PlayerImpl::getPlaylists()
{
    return std::vector<PlaylistInfo>();
}

std::vector<PlaylistItemInfo> PlayerImpl::getPlaylistItems(PlaylistQuery* query)
{
    return std::vector<PlaylistItemInfo>();
}

void PlayerImpl::addPlaylist(int32_t index, const std::string& title)
{
}

void PlayerImpl::removePlaylist(const PlaylistRef& playlist)
{
}

void PlayerImpl::movePlaylist(const PlaylistRef& playlist, int32_t index)
{
}

void PlayerImpl::clearPlaylist(const PlaylistRef& playlist)
{
}

void PlayerImpl::setCurrentPlaylist(const PlaylistRef& playlist)
{
}

void PlayerImpl::setPlaylistTitle(const PlaylistRef& playlist, const std::string& title)
{
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
