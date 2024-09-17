#pragma once

#include "../log.hpp"
#include "common.hpp"
#include "../project_info.hpp"

#include <memory>
#include <mutex>
#include <vector>

namespace msrv {
namespace player_deadbeef {

struct PlaylistMutex
{
    void lock() noexcept
    {
        ddbApi->pl_lock();
    }

    void unlock() noexcept
    {
        ddbApi->pl_unlock();
    }
};

struct ConfigMutex
{
    void lock() noexcept
    {
        ddbApi->conf_lock();
    }

    void unlock() noexcept
    {
        ddbApi->conf_unlock();
    }
};

struct PlaylistDeleter
{
    void operator()(ddb_playlist_t* playlist) noexcept
    {
        ddbApi->plt_unref(playlist);
    }
};

struct PlaylistItemDeleter
{
    void operator()(ddb_playItem_t* item) noexcept
    {
        ddbApi->pl_item_unref(item);
    }
};

struct TitleFormatDeleter
{
    void operator()(char* tf) noexcept
    {
        ddbApi->tf_free(tf);
    }
};

using ConfigLockGuard = std::lock_guard<ConfigMutex>;
using PlaylistLockGuard = std::lock_guard<PlaylistMutex>;

using PlaylistPtr = std::unique_ptr<ddb_playlist_t, PlaylistDeleter>;
using PlaylistItemPtr = std::unique_ptr<ddb_playItem_t, PlaylistItemDeleter>;
using TitleFormatPtr = std::unique_ptr<char, TitleFormatDeleter>;

constexpr int TITLE_FORMAT_BUFFER_SIZE = 1024;

PlaylistItemPtr resolvePlaylistItem(ddb_playlist_t* playlist, int32_t index);

inline PlaylistItemPtr copyPlaylistItemPtr(ddb_playItem_t* item)
{
    if (!item)
        return PlaylistItemPtr();

    ddbApi->pl_item_ref(item);
    return PlaylistItemPtr(item);
}

std::vector<TitleFormatPtr> compileColumns(
    const std::vector<std::string>& columns,
    bool throwOnError = true);

std::vector<std::string> evaluateColumns(
    ddb_playlist_t* playlist,
    ddb_playItem_t* item,
    const std::vector<TitleFormatPtr>& formatters);

class DeadbeefLogger final : public Logger
{
public:
    explicit DeadbeefLogger(DB_plugin_t* plugin)
        : plugin_(plugin), prefix_(MSRV_PROJECT_ID ": ")
    {
    }

    void log(LogLevel level, const char* string, va_list va) override;

private:
    DB_plugin_t* plugin_;
    std::string prefix_;
};

}
}
