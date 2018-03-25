#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

namespace {

inline t_size clampIndex(int32_t index, t_size count, t_size fallback);

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

class AsyncAddCompleter : public process_locations_notify
{
public:
    AsyncAddCompleter(
        service_ptr_t<playlist_manager_v4> playlistManager,
        std::shared_ptr<PlaylistMapping> playlists,
        const PlaylistRef& plref,
        int32_t index)
        : playlistManager_(playlistManager),
          playlists_(playlists),
          plref_(plref),
          index_(index)
    {
    }

    boost::unique_future<void> getResult() { return result_.get_future(); }

    virtual void on_completion(const pfc::list_base_const_t<metadb_handle_ptr>& items) override
    {
        try
        {
            complete(items);
        }
        catch (std::exception& ex)
        {
            result_.set_exception(ex);
            return;
        }

        result_.set_value();
    }

    virtual void on_aborted() override
    {
        result_.set_exception(InvalidRequestException("Operation aborted"));
    }

private:
    void complete(const pfc::list_base_const_t<metadb_handle_ptr>& items)
    {
        auto playlist = playlists_->resolve(plref_);
        auto itemCount = playlistManager_->playlist_get_item_count(playlist);
        auto index = clampIndex(index_, itemCount, pfc_infinite);
        playlistManager_->playlist_insert_items(playlist, index, items, bit_array_false());
    }

    service_ptr_t<playlist_manager_v4> playlistManager_;
    std::shared_ptr<PlaylistMapping> playlists_;
    PlaylistRef plref_;
    int32_t index_;
    boost::promise<void> result_;
};

std::vector<t_size> makeIndexes(t_size count)
{
    std::vector<t_size> indexes;
    indexes.reserve(count);

    for (t_size i = 0; i < count; i++)
        indexes.push_back(i);

    return indexes;
}

std::vector<t_size> makeIndexesReverse(t_size count)
{
    std::vector<t_size> indexes;
    indexes.reserve(count);

    for (t_size i = count; i > 0; i--)
        indexes.push_back(i - 1);

    return indexes;
}

inline t_size clampIndex(int32_t index, t_size count, t_size fallback)
{
    return index >= 0 && static_cast<t_size>(index) < count
        ? index
        : fallback;
}

}

std::vector<std::string> PlayerImpl::evaluatePlaylistColumns(
    t_size playlist,
    t_size item,
    const TitleFormatVector& compiledColumns,
    pfc::string8* buffer)
{
    std::vector<std::string> result;
    result.reserve(compiledColumns.size());

    for (auto& compiledColumn : compiledColumns)
    {
        playlistManager_->playlist_item_format_title(
            playlist,
            item,
            nullptr,
            *buffer,
            compiledColumn,
            nullptr,
            playback_control::display_level_basic);

        result.emplace_back(buffer->get_ptr(), buffer->get_length());
    }

    return result;
}

void PlayerImpl::makeItemsMask(
    t_size playlist,
    const std::vector<int32_t>& indexes,
    pfc::bit_array_flatIndexList* mask)
{
    auto count = playlistManager_->playlist_get_item_count(playlist);

    for (auto index : indexes)
    {
        if (index >= 0 && static_cast<t_size>(index) < count)
            mask->add(index);
    }

    mask->presort();
}

std::vector<PlaylistInfo> PlayerImpl::getPlaylists()
{
    playlists_->ensureInitialized();

    auto count = playlistManager_->get_playlist_count();
    auto current = playlistManager_->get_active_playlist();

    std::vector<PlaylistInfo> playlists;
    playlists.reserve(count);

    pfc::string8 nameBuffer;

    for (t_size i = 0; i < count; i++)
    {
        PlaylistInfo info;

        info.id = playlists_->getId(i);
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

PlaylistItemsResult PlayerImpl::getPlaylistItems(PlaylistQuery* queryPtr)
{
    auto query = static_cast<PlaylistQueryImpl*>(queryPtr);
    auto playlist = playlists_->resolve(query->plref);

    auto totalCount = playlistManager_->playlist_get_item_count(playlist);
    auto offset = std::min(static_cast<t_size>(query->range.offset), totalCount);
    auto endOffset = std::min(static_cast<t_size>(query->range.endOffset()), totalCount);

    std::vector<PlaylistItemInfo> items;

    if (offset < endOffset)
    {
        items.reserve(endOffset - offset);

        pfc::string8 buffer;

        for (t_size item = offset; item < endOffset; item++)
            items.emplace_back(evaluatePlaylistColumns(playlist, item, query->columns, &buffer));
    }

    return PlaylistItemsResult(offset, totalCount, std::move(items));
}

void PlayerImpl::addPlaylist(int32_t index, const std::string& title)
{
    playlists_->ensureInitialized();

    playlistManager_->create_playlist(
        title.data(),
        title.length(),
        clampIndex(index, playlistManager_->get_playlist_count(), pfc_infinite));
}

void PlayerImpl::removePlaylist(const PlaylistRef& playlist)
{
    playlistManager_->remove_playlist_switch(playlists_->resolve(playlist));

    if (playlistManager_->get_playlist_count() == 0)
    {
        playlistManager_->create_playlist_autoname();
        playlistManager_->set_active_playlist(0);
    }
}

void PlayerImpl::movePlaylist(const PlaylistRef& playlist, int32_t index)
{
    auto count = playlistManager_->get_playlist_count();
    auto oldIndex = playlists_->resolve(playlist);
    auto newIndex = clampIndex(index, count, count - 1);

    if (newIndex == oldIndex)
        return;

    auto indexes = makeIndexes(count);
    pfc::create_move_item_permutation(indexes.data(), count, oldIndex, newIndex);
    playlistManager_->reorder(indexes.data(), count);
}

void PlayerImpl::clearPlaylist(const PlaylistRef& playlist)
{
    playlistManager_->playlist_clear(playlists_->resolve(playlist));
}

void PlayerImpl::setCurrentPlaylist(const PlaylistRef& playlist)
{
    playlistManager_->set_active_playlist(playlists_->resolve(playlist));
}

void PlayerImpl::setPlaylistTitle(const PlaylistRef& playlist, const std::string& title)
{
    playlistManager_->playlist_rename(playlists_->resolve(playlist), title.data(), title.length());
}

boost::unique_future<void> PlayerImpl::addPlaylistItems(
    const PlaylistRef& plref,
    const std::vector<std::string>& items,
    int32_t targetIndex)
{
    pfc::list_t<const char*> itemsList;

    itemsList.prealloc(items.size());

    for (auto& item : items)
        itemsList.add_item(item.c_str());

    service_ptr_t<AsyncAddCompleter> completer(
        new service_impl_t<AsyncAddCompleter>(
            playlistManager_, playlists_, plref, targetIndex));

    incomingItemFilter_->process_locations_async(
        itemsList,
        playlist_incoming_item_filter_v2::op_flag_background,
        nullptr,
        nullptr,
        core_api::get_main_window(),
        completer);

    return completer->getResult();
}

void PlayerImpl::copyPlaylistItems(
    const PlaylistRef& sourcePlaylist,
    const PlaylistRef& targetPlaylist,
    const std::vector<int32_t>& sourceItemIndexes,
    int32_t targetIndex)
{
    auto source = playlists_->resolve(sourcePlaylist);
    auto target = playlists_->resolve(targetPlaylist);

    pfc::bit_array_flatIndexList items;
    makeItemsMask(source, sourceItemIndexes, &items);

    pfc::list_t<metadb_handle_ptr> handles;
    playlistManager_->playlist_get_items(source, handles, items);

    auto position = clampIndex(
        targetIndex,
        playlistManager_->playlist_get_item_count(target),
        pfc_infinite);

    playlistManager_->playlist_insert_items(target, position, handles, bit_array_false());
}

void PlayerImpl::movePlaylistItems(
    const PlaylistRef& sourcePlaylist,
    const PlaylistRef& targetPlaylist,
    const std::vector<int32_t>& sourceItemIndexes,
    int32_t targetIndex)
{
    auto source = playlists_->resolve(sourcePlaylist);
    auto target = playlists_->resolve(targetPlaylist);

    auto position = clampIndex(
        targetIndex,
        playlistManager_->playlist_get_item_count(target),
        pfc_infinite);

    pfc::bit_array_flatIndexList items;
    makeItemsMask(source, sourceItemIndexes, &items);

    if (source == target && position != pfc_infinite)
        position -= items.calc_count(true, 0, position);

    pfc::list_t<metadb_handle_ptr> handles;
    playlistManager_->playlist_get_items(source, handles, items);
    playlistManager_->playlist_remove_items(source, items);
    playlistManager_->playlist_insert_items(target, position, handles, bit_array_false());
}

void PlayerImpl::removePlaylistItems(
    const PlaylistRef& plref,
    const std::vector<int32_t>& itemIndexes)
{
    auto playlist = playlists_->resolve(plref);
    pfc::bit_array_flatIndexList items;
    makeItemsMask(playlist, itemIndexes, &items);
    playlistManager_->playlist_remove_items(playlist, items);
}

void PlayerImpl::sortPlaylist(
    const PlaylistRef& plref,
    const std::string& expression,
    bool descending)
{
    auto playlist = playlists_->resolve(plref);

    titleformat_object::ptr sortBy;
    if (!titleFormatCompiler_->compile(sortBy, expression.c_str()))
        throw InvalidRequestException("Invalid title format");

    auto count = playlistManager_->playlist_get_item_count(playlist);
    if (count == 0)
        return;

    pfc::list_t<metadb_handle_ptr> items;
    items.prealloc(count);
    playlistManager_->playlist_get_items(playlist, items, bit_array_true());

    std::vector<t_size> order;
    order.resize(count);
    metadb_handle_list_helper::sort_by_format_get_order(
        items, order.data(), sortBy, nullptr, descending ? -1 : 1);

    playlistManager_->playlist_reorder_items(playlist, order.data(), count);
}

void PlayerImpl::sortPlaylistRandom(const PlaylistRef& plref)
{
    playlistManager_->playlist_sort_by_format(playlists_->resolve(plref), nullptr, false);
}

PlaylistQueryPtr PlayerImpl::createPlaylistQuery(
    const PlaylistRef& playlist,
    const Range& range,
    const std::vector<std::string>& columns)
{
    return std::make_unique<PlaylistQueryImpl>(playlist, range, compileColumns(columns));
}

}}
