#include "player.hpp"
#include "add_items_scope.hpp"

namespace msrv {
namespace player_deadbeef {

class AddItemsTask
{
public:
    AddItemsTask(
        PlaylistMappingImpl* playlists,
        const PlaylistRef& plref,
        const std::vector<std::string>& items,
        int32_t targetIndex,
        AddItemsOptions options);

    ~AddItemsTask();

    void execute();

private:
    void initialize();
    void addItems();
    void playAddedItems();

    PlaylistMutex playlistMutex_;
    PlaylistMappingImpl* playlists_;
    PlaylistPtr playlist_;
    PlaylistItemPtr targetItem_;
    PlaylistRef plref_;
    std::vector<std::string> items_;
    int32_t targetIndex_;
    AddItemsOptions options_;
    bool hasAddedItems_{false};

    MSRV_NO_COPY_AND_ASSIGN(AddItemsTask);
};

void PlayerImpl::endModifyPlaylist(ddb_playlist_t* playlist)
{
    ddbApi->plt_save_config(playlist);
    ddbApi->sendmessage(DB_EV_PLAYLISTCHANGED, 0, DDB_PLAYLIST_CHANGE_CONTENT, 0);
}

PlaylistInfo PlayerImpl::getPlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    auto pair = playlists_.getPlaylistAndIndex(plref);
    auto index = pair.second;
    auto isCurrent = index == ddbApi->plt_get_curr_idx();

    return getPlaylistInfo(index, pair.first.get(), isCurrent);
}

std::vector<PlaylistInfo> PlayerImpl::getPlaylists()
{
    std::vector<PlaylistInfo> playlists;

    PlaylistLockGuard lock(playlistMutex_);

    int count = ddbApi->plt_get_count();
    int current = ddbApi->plt_get_curr_idx();

    playlists.reserve(count);
    playlists_.playlistIds(); // rebuild early if necessary

    for (int i = 0; i < count; i++)
    {
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(i));

        if (playlist)
            playlists.emplace_back(getPlaylistInfo(i, playlist.get(), i == current));
    }

    return playlists;
}

PlaylistInfo PlayerImpl::getPlaylistInfo(int32_t index, ddb_playlist_t* playlist, bool isCurrent)
{
    PlaylistInfo info;
    info.id = playlists_.getId(index);
    info.index = index;

    char titleBuf[256];
    ddbApi->plt_get_title(playlist, titleBuf, sizeof(titleBuf));
    info.title = titleBuf;

    info.itemCount = ddbApi->plt_get_item_count(playlist, PL_MAIN);
    info.totalTime = ddbApi->plt_get_totaltime(playlist);
    info.isCurrent = isCurrent;
    return info;
}

PlaylistItemsResult PlayerImpl::getPlaylistItems(const PlaylistRef& plref, const Range& range, ColumnsQuery* query)
{
    auto queryImpl = dynamic_cast<ColumnsQueryImpl*>(query);
    if (!queryImpl)
        throw std::logic_error("ColumnsQueryImpl is required");

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr playlist = playlists_.getPlaylist(plref);

    int32_t totalCount = ddbApi->plt_get_item_count(playlist.get(), PL_MAIN);
    int32_t offset = std::min(range.offset, totalCount);
    int32_t endOffset = std::min(range.endOffset(), totalCount);
    int32_t count = endOffset - offset;

    std::vector<PlaylistItemInfo> items;

    if (count > 0)
    {
        items.reserve(static_cast<size_t>(count));

        PlaylistItemPtr item = resolvePlaylistItem(playlist.get(), offset);

        while (item && count > 0)
        {
            PlaylistItemInfo itemInfo;
            itemInfo.columns = queryImpl->evaluate(playlist.get(), item.get());
            items.emplace_back(std::move(itemInfo));
            item.reset(ddbApi->pl_get_next(item.get(), PL_MAIN));
            count--;
        }
    }

    return PlaylistItemsResult(offset, totalCount, std::move(items));
}

PlaylistInfo PlayerImpl::addPlaylist(int32_t index, const std::string& title, bool setCurrent)
{
    PlaylistLockGuard lock(playlistMutex_);

    int count = ddbApi->plt_get_count();
    if (index < 0 || index > count)
        index = count;

    int realIndex = ddbApi->plt_add(index, title.c_str());
    PlaylistPtr playlist(ddbApi->plt_get_for_idx(realIndex));
    playlists_.rebuild();

    if (setCurrent)
    {
        ddbApi->plt_set_curr(playlist.get());
    }

    return getPlaylistInfo(realIndex, playlist.get(), setCurrent);
}

void PlayerImpl::removePlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    ddbApi->plt_remove(playlists_.getIndex(plref));
    // no need to send DDB_PLAYLIST_CHANGE_DELETED, it is done automatically
}

void PlayerImpl::movePlaylist(const PlaylistRef& plref, int32_t targetIndex)
{
    PlaylistLockGuard lock(playlistMutex_);

    int sourceIndex = playlists_.getIndex(plref);

    int count = ddbApi->plt_get_count();
    if (targetIndex < 0 || targetIndex >= count)
        targetIndex = count - 1;

    if (sourceIndex == targetIndex)
        return;

    ddbApi->plt_move(sourceIndex, targetIndex);
    ddbApi->sendmessage(DB_EV_PLAYLISTCHANGED, 0, DDB_PLAYLIST_CHANGE_POSITION, 0);
}

void PlayerImpl::clearPlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr playlist = playlists_.getPlaylist(plref);

    ddbApi->plt_clear(playlist.get());
    endModifyPlaylist(playlist.get());
}

void PlayerImpl::setCurrentPlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    int index = playlists_.getIndex(plref);
    ddbApi->plt_set_curr_idx(index);
}

void PlayerImpl::setPlaylistTitle(const PlaylistRef& plref, const std::string& title)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr playlist = playlists_.getPlaylist(plref);
    ddbApi->plt_set_title(playlist.get(), title.c_str());
}

boost::unique_future<void> PlayerImpl::addPlaylistItems(
    const PlaylistRef& plref,
    const std::vector<std::string>& items,
    int32_t targetIndex,
    AddItemsOptions options)
{
    auto task = std::make_shared<AddItemsTask>(&playlists_, plref, items, targetIndex, options);
    return boost::async([task] { task->execute(); });
}

void PlayerImpl::copyPlaylistItems(
    const PlaylistRef& sourceRef,
    const PlaylistRef& targetRef,
    const std::vector<int32_t>& sourceIndexes,
    int32_t targetIndex)
{
    std::vector<uint32_t> indexes(sourceIndexes.begin(), sourceIndexes.end());

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr sourcePlaylist = playlists_.getPlaylist(sourceRef);
    PlaylistPtr targetPlaylist = playlists_.getPlaylist(targetRef);
    PlaylistItemPtr targetItem = resolvePlaylistItem(targetPlaylist.get(), targetIndex);

    // Workaround invalid copying to current playlist, report a bug to deadbeef?
    ddbApi->plt_set_curr(targetPlaylist.get());

    ddbApi->plt_copy_items(
        targetPlaylist.get(), PL_MAIN,
        sourcePlaylist.get(), targetItem.get(),
        indexes.data(), indexes.size());

    endModifyPlaylist(targetPlaylist.get());
}

void PlayerImpl::movePlaylistItems(
    const PlaylistRef& sourceRef,
    const PlaylistRef& targetRef,
    const std::vector<int32_t>& sourceIndexes,
    int32_t targetIndex)
{
    std::vector<uint32_t> indexes(sourceIndexes.begin(), sourceIndexes.end());

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr sourcePlaylist = playlists_.getPlaylist(sourceRef);
    PlaylistPtr targetPlaylist = playlists_.getPlaylist(targetRef);
    PlaylistItemPtr targetItem = resolvePlaylistItem(targetPlaylist.get(), targetIndex);

    ddbApi->plt_move_items(
        targetPlaylist.get(), PL_MAIN,
        sourcePlaylist.get(), targetItem.get(),
        indexes.data(), indexes.size());

    endModifyPlaylist(targetPlaylist.get());
}

void PlayerImpl::removePlaylistItems(
    const PlaylistRef& plref,
    const std::vector<int32_t>& indexes)
{
    std::vector<int32_t> sortedIndexes(indexes);
    std::sort(sortedIndexes.begin(), sortedIndexes.end(), std::greater<int32_t>());

    PlaylistLockGuard lock(playlistMutex_);
    PlaylistPtr playlist = playlists_.getPlaylist(plref);

    int32_t lastIndex = -1;

    for (int32_t index : sortedIndexes)
    {
        if (index == lastIndex)
            continue;

        PlaylistItemPtr item = resolvePlaylistItem(playlist.get(), index);

        if (item)
            ddbApi->plt_remove_item(playlist.get(), item.get());

        lastIndex = index;
    }

    endModifyPlaylist(playlist.get());
}

void PlayerImpl::sortPlaylist(const PlaylistRef& plref, const std::string& expression, bool descending)
{
    PlaylistLockGuard lock(playlistMutex_);
    PlaylistPtr playlist = playlists_.getPlaylist(plref);
    int order = descending ? DDB_SORT_DESCENDING : DDB_SORT_ASCENDING;
    ddbApi->plt_sort_v2(playlist.get(), PL_MAIN, -1, expression.c_str(), order);
    endModifyPlaylist(playlist.get());
}

void PlayerImpl::sortPlaylistRandom(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);
    PlaylistPtr playlist = playlists_.getPlaylist(plref);
    ddbApi->plt_sort_v2(playlist.get(), PL_MAIN, -1, nullptr, DDB_SORT_RANDOM);
    endModifyPlaylist(playlist.get());
}

AddItemsTask::AddItemsTask(
    PlaylistMappingImpl* playlists,
    const PlaylistRef& plref,
    const std::vector<std::string>& items,
    int32_t targetIndex,
    AddItemsOptions options)
    : playlists_(playlists),
      plref_(plref),
      items_(items),
      targetIndex_(targetIndex),
      options_(options)
{
}

AddItemsTask::~AddItemsTask() = default;

void AddItemsTask::initialize()
{
    PlaylistLockGuard lock(playlistMutex_);

    playlist_ = playlists_->getPlaylist(plref_);

    if (hasFlags(options_, AddItemsOptions::REPLACE))
        return;

    auto itemAfterTarget = resolvePlaylistItem(playlist_.get(), targetIndex_);

    if (itemAfterTarget)
        targetItem_.reset(ddbApi->pl_get_prev(itemAfterTarget.get(), PL_MAIN));
    else
        targetItem_.reset(ddbApi->plt_get_last(playlist_.get(), PL_MAIN));
}

void AddItemsTask::execute()
{
    initialize();
    addItems();

    if (hasFlags(options_, AddItemsOptions::PLAY))
        playAddedItems();
}

void AddItemsTask::addItems()
{
    AddItemsScope addScope(playlist_.get(), 47);

    if (hasFlags(options_, AddItemsOptions::REPLACE))
        ddbApi->plt_clear(playlist_.get());
    else
        addScope.setLastItem(copyPlaylistItemPtr(targetItem_.get()));

    for (auto& item : items_)
    {
        if (addScope.add(item))
            hasAddedItems_ = true;
    }

    PlayerImpl::endModifyPlaylist(playlist_.get());
}

void AddItemsTask::playAddedItems()
{
    PlaylistLockGuard lock{playlistMutex_};

    if (!hasAddedItems_)
    {
        ddbApi->sendmessage(DB_EV_STOP, 0, 0, 0);
        return;
    }

    PlaylistItemPtr firstAddedItem(
        targetItem_
        ? ddbApi->pl_get_next(targetItem_.get(), PL_MAIN)
        : ddbApi->plt_get_first(playlist_.get(), PL_MAIN));

    if (!firstAddedItem)
    {
        ddbApi->sendmessage(DB_EV_STOP, 0, 0, 0);
        return;
    }

    PlaylistPtr currentPlaylist(ddbApi->plt_get_curr());

    if (playlist_ != currentPlaylist)
        ddbApi->plt_set_curr(playlist_.get());

    auto index = ddbApi->plt_get_item_idx(playlist_.get(), firstAddedItem.get(), PL_MAIN);
    ddbApi->sendmessage(DB_EV_PLAY_NUM, 0, index, 0);
}

}
}
