#pragma once

#include "defines.hpp"
#include "core_types.hpp"

#include <vector>
#include <string>
#include <memory>
#include <functional>
#include <unordered_map>

#include <boost/thread/future.hpp>

namespace msrv {

class WorkQueue;

enum class PlaybackState
{
    STOPPED,
    PLAYING,
    PAUSED,
};

enum class PlayerEvent
{
    PLAYER_CHANGED,
    PLAYLIST_SET_CHANGED,
    PLAYLIST_ITEMS_CHANGED,
    COUNT
};

enum class VolumeType
{
    DB,
    LINEAR,
};

enum class AddItemsOptions : int
{
    NONE = 0,
    REPLACE = 1,
    PLAY = 2,
};

MSRV_ENUM_FLAGS(AddItemsOptions, int)

struct VolumeInfo
{
    VolumeType type;
    double min;
    double max;
    double value;
    bool isMuted;
};

struct PlayerInfo
{
    std::string name;
    std::string title;
    std::string version;
    std::string pluginVersion;
};

struct ActiveItemInfo
{
    int32_t playlistIndex;
    std::string playlistId;
    int32_t index;
    double position;
    double duration;
    std::vector<std::string> columns;
};

struct PlayerState
{
    PlayerInfo info;
    PlaybackState playbackState;
    VolumeInfo volume;
    ActiveItemInfo activeItem;
    int32_t playbackMode;
    const std::vector<std::string>* playbackModes;
};

struct PlaylistInfo
{
    PlaylistInfo() = default;
    PlaylistInfo(PlaylistInfo&&) = default;
    PlaylistInfo& operator=(PlaylistInfo&&) = default;

    std::string id;
    int32_t index;
    std::string title;
    int32_t itemCount;
    double totalTime;
    bool isCurrent;
};

struct PlaylistItemInfo
{
    PlaylistItemInfo() = default;

    PlaylistItemInfo(std::vector<std::string> columnsVal)
        : columns(std::move(columnsVal)) { }

    PlaylistItemInfo(PlaylistItemInfo&&) = default;
    PlaylistItemInfo& operator=(PlaylistItemInfo&&) = default;

    std::vector<std::string> columns;
};

struct PlaylistItemsResult
{
    PlaylistItemsResult() = default;

    PlaylistItemsResult(
        int32_t offsetVal,
        int32_t totalCountVal,
        std::vector<PlaylistItemInfo> itemsVal)
        : offset(offsetVal),
          totalCount(totalCountVal),
          items(std::move(itemsVal)) { }

    PlaylistItemsResult(PlaylistItemsResult&&) = default;
    PlaylistItemsResult& operator=(PlaylistItemsResult&&) = default;

    int32_t offset;
    int32_t totalCount;
    std::vector<PlaylistItemInfo> items;
};

enum class PlaylistRefType
{
    INVALID,
    INDEX,
    ID
};

class PlaylistRef
{
public:
    PlaylistRef()
        : index_(-1), id_() { }

    explicit PlaylistRef(int32_t index)
        : index_(index), id_()
    {
        if (index_ < 0)
            throw std::invalid_argument("index should be greater or equal to 0");
    }

    explicit PlaylistRef(std::string id)
        : index_(-1), id_(std::move(id))
    {
        if (id_.empty())
            throw std::invalid_argument("id should not be empty");
    }

    PlaylistRef(const PlaylistRef&) = default;

    PlaylistRefType type() const
    {
        if (index_ >= 0)
            return PlaylistRefType::INDEX;

        if (!id_.empty())
            return PlaylistRefType::ID;

        return PlaylistRefType::INVALID;
    }

    PlaylistRef& operator=(const PlaylistRef&) = default;

    int32_t index() const { return index_; }

    const std::string& id() const { return id_; }

private:
    int32_t index_;
    std::string id_;
};

class TrackQuery
{
public:
    TrackQuery() = default;
    virtual ~TrackQuery();

    MSRV_NO_COPY_AND_ASSIGN(TrackQuery);
};

class PlaylistQuery
{
public:
    PlaylistQuery() = default;
    virtual ~PlaylistQuery();

    MSRV_NO_COPY_AND_ASSIGN(PlaylistQuery);
};

struct ArtworkQuery
{
    PlaylistRef playlist;
    int32_t index;
};

struct ArtworkResult
{
    ArtworkResult() { }

    ArtworkResult(std::string filePathVal) : filePath(std::move(filePathVal)) { }
    ArtworkResult(std::vector<uint8_t> fileDataVal) : fileData(std::move(fileDataVal)) { }

    ArtworkResult(const void* data, size_t size)
    {
        fileData.resize(size);
        memcpy(fileData.data(), data, size);
    }

    ArtworkResult(ArtworkResult&&) = default;
    ArtworkResult& operator=(ArtworkResult&&) = default;

    std::string filePath;
    std::vector<uint8_t> fileData;
};

using PlayerStatePtr = std::unique_ptr<PlayerState>;
using TrackQueryPtr = std::unique_ptr<TrackQuery>;
using PlaylistQueryPtr = std::unique_ptr<PlaylistQuery>;
using PlayerEventCallback = std::function<void(PlayerEvent)>;

class Player
{
public:
    Player() = default;
    virtual ~Player();

    virtual std::unique_ptr<WorkQueue> createWorkQueue() = 0;

    // Player control and query API

    virtual PlayerStatePtr queryPlayerState(TrackQuery* activeItemQuery) = 0;

    virtual void playCurrent() = 0;
    virtual void playItem(const PlaylistRef& playlist, int32_t itemIndex) = 0;
    virtual void playRandom() = 0;
    virtual void playNext() = 0;
    virtual bool playNextBy(const std::string& expression) = 0;
    virtual void playPrevious() = 0;
    virtual bool playPreviousBy(const std::string& expression) = 0;
    virtual void stop() = 0;
    virtual void pause() = 0;
    virtual void togglePause() = 0;

    virtual void setMuted(Switch val) = 0;
    virtual void seekAbsolute(double offsetSeconds) = 0;
    virtual void seekRelative(double offsetSeconds) = 0;
    virtual void setVolume(double val) = 0;
    virtual void setPlaybackMode(int32_t val) = 0;

    virtual TrackQueryPtr createTrackQuery(
        const std::vector<std::string>& columns) = 0;

    // Playlists API

    virtual std::vector<PlaylistInfo> getPlaylists() = 0;
    virtual PlaylistItemsResult getPlaylistItems(PlaylistQuery* query) = 0;

    virtual void addPlaylist(int32_t index, const std::string& title) = 0;
    virtual void removePlaylist(const PlaylistRef& playlist) = 0;
    virtual void movePlaylist(const PlaylistRef& playlist, int32_t index) = 0;
    virtual void clearPlaylist(const PlaylistRef& playlist) = 0;
    virtual void setCurrentPlaylist(const PlaylistRef& playlist) = 0;
    virtual void setPlaylistTitle(const PlaylistRef& playlist, const std::string& title) = 0;

    virtual boost::unique_future<void> addPlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<std::string>& items,
        int32_t targetIndex,
        AddItemsOptions options) = 0;

    virtual void copyPlaylistItems(
        const PlaylistRef& sourcePlaylist,
        const PlaylistRef& targetPlaylist,
        const std::vector<int32_t>& sourceItemIndexes,
        int32_t targetIndex) = 0;

    virtual void movePlaylistItems(
        const PlaylistRef& sourcePlaylist,
        const PlaylistRef& targetPlaylist,
        const std::vector<int32_t>& sourceItemIndexes,
        int32_t targetIndex) = 0;

    virtual void removePlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<int32_t>& itemIndexes) = 0;

    virtual void sortPlaylist(
        const PlaylistRef& plref,
        const std::string& expression,
        bool descending) = 0;

    virtual void sortPlaylistRandom(const PlaylistRef& plref) = 0;

    virtual PlaylistQueryPtr createPlaylistQuery(
        const PlaylistRef& playlist,
        const Range& range,
        const std::vector<std::string>& columns) = 0;

    // Artwork API

    virtual boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) = 0;

    // Events API

    void onEvent(PlayerEventCallback callback) { eventCallback_ = std::move(callback); }

protected:
    void emitEvent(PlayerEvent event)
    {
        if (eventCallback_)
            eventCallback_(event);
    }

private:
    PlayerEventCallback eventCallback_;

    MSRV_NO_COPY_AND_ASSIGN(Player);
};

}
