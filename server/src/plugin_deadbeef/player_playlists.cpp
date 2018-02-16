#include "player.hpp"
#include "add_items_scope.hpp"

namespace msrv {
namespace plugin_deadbeef {

class PlaylistQueryImpl : public PlaylistQuery
{
public:
    PlaylistQueryImpl(
        const PlaylistRef& plrefVal,
        const Range& rangeVal,
        const std::vector<std::string>& columns);

    ~PlaylistQueryImpl();

    PlaylistRef plref;
    Range range;
    std::vector<TitleFormatPtr> formatters;
};

class AddItemsTask
{
public:
    AddItemsTask(
        PlaylistMapping* playlists,
        const PlaylistRef& plref,
        const std::vector<std::string>& items,
        int32_t targetIndex);

    ~AddItemsTask();

    void execute();

private:
    PlaylistPtr resolvePlaylist();

    PlaylistMapping* playlists_;
    PlaylistRef plref_;
    std::vector<std::string> items_;
    int32_t targetIndex_;

    MSRV_NO_COPY_AND_ASSIGN(AddItemsTask);
};

void PlayerImpl::endModifyPlaylist(ddb_playlist_t* playlist)
{
    ddbApi->plt_save_config(playlist);
    ddbApi->sendmessage(DB_EV_PLAYLISTCHANGED, 0, DDB_PLAYLIST_CHANGE_CONTENT, 0);
}

std::unique_ptr<PlaylistQuery> PlayerImpl::createPlaylistQuery(
    const PlaylistRef& plref,
    const Range& range,
    const std::vector<std::string>& columns)
{
    return std::make_unique<PlaylistQueryImpl>(plref, range, columns);
}

std::vector<PlaylistInfo> PlayerImpl::getPlaylists()
{
    std::vector<PlaylistInfo> playlists;

    PlaylistLockGuard lock(playlistMutex_);

    playlists_.ensureInitialized();

    int count = ddbApi->plt_get_count();
    int current =  ddbApi->plt_get_curr_idx();

    playlists.reserve(count);

    for (int i = 0; i < count; i++)
    {
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(i));

        if (!playlist)
            continue;

        PlaylistInfo info;

        info.id = playlists_.getId(playlist.get());
        info.index = i;

        char titleBuf[256];
        ddbApi->plt_get_title(playlist.get(), titleBuf, sizeof(titleBuf));
        info.title = titleBuf;

        info.itemCount = ddbApi->plt_get_item_count(playlist.get(), PL_MAIN);
        info.totalTime = ddbApi->plt_get_totaltime(playlist.get());
        info.isCurrent = i == current;

        playlists.emplace_back(std::move(info));
    }

    return playlists;
}

std::vector<PlaylistItemInfo> PlayerImpl::getPlaylistItems(PlaylistQuery* query)
{
    PlaylistQueryImpl* queryImpl = static_cast<PlaylistQueryImpl*>(query);

    std::vector<PlaylistItemInfo> items;

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr playlist = playlists_.resolve(queryImpl->plref);
    PlaylistItemPtr item = resolvePlaylistItem(playlist.get(), queryImpl->range.offset);
    int32_t count = queryImpl->range.count;

    while (item && count > 0)
    {
        PlaylistItemInfo itemInfo;
        itemInfo.columns = evaluateColumns(playlist.get(), item.get(), queryImpl->formatters);
        items.emplace_back(std::move(itemInfo));
        item.reset(ddbApi->pl_get_next(item.get(), PL_MAIN));
        count--;
    }

    return items;
}

void PlayerImpl::addPlaylist(int32_t index, const std::string& title)
{
    PlaylistLockGuard lock(playlistMutex_);

    playlists_.ensureInitialized();

    int count = ddbApi->plt_get_count();
    if (index < 0 || index > count)
        index = count;

    int playlistIndex = ddbApi->plt_add(index, title.c_str());
    PlaylistPtr playlist(ddbApi->plt_get_for_idx(playlistIndex));
    playlists_.getId(playlist.get());
}

void PlayerImpl::removePlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    ddbApi->plt_remove(playlists_.resolveIndex(plref));
}

void PlayerImpl::movePlaylist(const PlaylistRef& plref, int32_t targetIndex)
{
    PlaylistLockGuard lock(playlistMutex_);

    int count = ddbApi->plt_get_count();
    if (targetIndex < 0 || targetIndex > count)
        targetIndex = count;

    int sourceIndex = playlists_.resolveIndex(plref);
    ddbApi->plt_move(sourceIndex, targetIndex);
}

void PlayerImpl::clearPlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr playlist = playlists_.resolve(plref);

    ddbApi->plt_clear(playlist.get());
    endModifyPlaylist(playlist.get());
}

void PlayerImpl::setCurrentPlaylist(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);

    int index = playlists_.resolveIndex(plref);
    ddbApi->plt_set_curr_idx(index);
}

void PlayerImpl::setPlaylistTitle(const PlaylistRef& plref, const std::string& title)
{
    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr playlist = playlists_.resolve(plref);
    ddbApi->plt_set_title(playlist.get(), title.c_str());
}

boost::unique_future<void> PlayerImpl::addPlaylistItems(
    const PlaylistRef& plref,
    const std::vector<std::string>& items,
    int32_t targetIndex)
{
    auto task = std::make_shared<AddItemsTask>(&playlists_, plref, items, targetIndex);
    return boost::async([task]{ task->execute(); });
}

void PlayerImpl::copyPlaylistItems(
    const PlaylistRef& sourceRef,
    const PlaylistRef& targetRef,
    const std::vector<int32_t>& sourceIndexes,
    int32_t targetIndex)
{
    std::vector<uint32_t> indexes(sourceIndexes.begin(), sourceIndexes.end());

    PlaylistLockGuard lock(playlistMutex_);

    PlaylistPtr sourcePlaylist = playlists_.resolve(sourceRef);
    PlaylistPtr targetPlaylist = playlists_.resolve(targetRef);
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

    PlaylistPtr sourcePlaylist = playlists_.resolve(sourceRef);
    PlaylistPtr targetPlaylist = playlists_.resolve(targetRef);
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
    std::sort(sortedIndexes.begin(), sortedIndexes.end(),  std::greater<int32_t>());

    PlaylistLockGuard lock(playlistMutex_);
    PlaylistPtr playlist = playlists_.resolve(plref);

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
}

void PlayerImpl::sortPlaylist(const PlaylistRef& plref, const std::string& expression, bool descending)
{
    PlaylistLockGuard lock(playlistMutex_);
    PlaylistPtr playlist = playlists_.resolve(plref);
    int order = descending ? DDB_SORT_DESCENDING : DDB_SORT_ASCENDING;
    ddbApi->plt_sort_v2(playlist.get(), PL_MAIN, -1, expression.c_str(), order);
    endModifyPlaylist(playlist.get());
}

void PlayerImpl::sortPlaylistRandom(const PlaylistRef& plref)
{
    PlaylistLockGuard lock(playlistMutex_);
    PlaylistPtr playlist = playlists_.resolve(plref);
    ddbApi->plt_sort_v2(playlist.get(), PL_MAIN, -1, nullptr, DDB_SORT_RANDOM);
    endModifyPlaylist(playlist.get());
}

PlaylistQueryImpl::PlaylistQueryImpl(
    const PlaylistRef& plrefVal,
    const Range& rangeVal,
    const std::vector<std::string>& columns)
    : plref(plrefVal),
      range(rangeVal),
      formatters(compileColumns(columns))
{
}

PlaylistQueryImpl::~PlaylistQueryImpl()
{
}

AddItemsTask::AddItemsTask(
    PlaylistMapping* playlists,
    const PlaylistRef& plref,
    const std::vector<std::string>& items,
    int32_t targetIndex)
    : playlists_(playlists),
      plref_(plref),
      items_(items),
      targetIndex_(targetIndex)
{
}

AddItemsTask::~AddItemsTask()
{
}

PlaylistPtr AddItemsTask::resolvePlaylist()
{
    PlaylistMutex mutex;
    PlaylistLockGuard lock(mutex);
    return playlists_->resolve(plref_);
}

void AddItemsTask::execute()
{
    PlaylistPtr playlist = resolvePlaylist();
    AddItemsScope addScope(playlist.get(), 47);
    PlaylistItemPtr targetItem = resolvePlaylistItem(playlist.get(), targetIndex_);

    PlaylistItemPtr lastItem(
        targetItem
            ? ddbApi->pl_get_prev(targetItem.get(), PL_MAIN)
            : ddbApi->plt_get_last(playlist.get(), PL_MAIN));

    targetItem.reset();
    addScope.setLastItem(std::move(lastItem));

    for (auto& item : items_)
        addScope.add(item);
}

}}
