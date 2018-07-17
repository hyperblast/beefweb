#pragma once

#include "common.hpp"

#include <memory>
#include <mutex>
#include <vector>

namespace msrv {
namespace player_deadbeef {

struct PlaylistMutex
{
    void lock() noexcept { ddbApi->pl_lock(); }
    void unlock() noexcept { ddbApi->pl_unlock(); }
};

struct ConfigMutex
{
    void lock() noexcept { ddbApi->conf_lock(); }
    void unlock() noexcept { ddbApi->conf_unlock(); }
};

struct PlaylistDeleter
{
    void operator()(ddb_playlist_t* playlist) noexcept { ddbApi->plt_unref(playlist); }
};

struct PlaylistItemDeleter
{
    void operator()(ddb_playItem_t* item) noexcept { ddbApi->pl_item_unref(item); }
};

struct TitleFormatDeleter
{
    void operator()(char* tf) noexcept { ddbApi->tf_free(tf); }
};

using ConfigLockGuard = std::lock_guard<ConfigMutex>;
using PlaylistLockGuard = std::lock_guard<PlaylistMutex>;

using PlaylistPtr = std::unique_ptr<ddb_playlist_t, PlaylistDeleter>;
using PlaylistItemPtr = std::unique_ptr<ddb_playItem_t, PlaylistItemDeleter>;
using TitleFormatPtr = std::unique_ptr<char, TitleFormatDeleter>;

PlaylistItemPtr resolvePlaylistItem(ddb_playlist_t* playlist, int32_t index);

std::vector<TitleFormatPtr> compileColumns(
    const std::vector<std::string>& columns,
    bool throwOnError = true);

std::vector<std::string> evaluateColumns(
    ddb_playlist_t* playlist,
    ddb_playItem_t* item,
    const std::vector<TitleFormatPtr>& formatters);

}}
