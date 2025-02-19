#pragma once

#include "defines.hpp"
#include "core_types.hpp"

#include <vector>
#include <string>
#include <memory>
#include <functional>

#include <boost/thread/future.hpp>

namespace msrv {

class WorkQueue;

class Player;

class PlayerOption;

class BoolPlayerOption;

class EnumPlayerOption;

enum class PlaybackState
{
    STOPPED,
    PLAYING,
    PAUSED,
};

enum class PlayerEvents : int
{
    NONE = 0,
    PLAYER_CHANGED = 1 << 0,
    PLAYLIST_SET_CHANGED = 1 << 1,
    PLAYLIST_ITEMS_CHANGED = 1 << 2,
    PLAY_QUEUE_CHANGED = 1 << 3,
    OUTPUTS_CHANGED = 1 << 4,
};

MSRV_ENUM_FLAGS(PlayerEvents, int);

enum class VolumeType
{
    DB,
    LINEAR,
    UP_DOWN,
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
    PlaybackState playbackState = PlaybackState::STOPPED;
    VolumeInfo volume{};
    ActiveItemInfo activeItem;

    const std::vector<PlayerOption*>* options = nullptr;
    EnumPlayerOption* playbackModeOption = nullptr; // compat with versions < 0.7
};

struct PlaylistInfo
{
    PlaylistInfo() = default;
    PlaylistInfo(PlaylistInfo&&) = default;
    PlaylistInfo& operator=(PlaylistInfo&&) = default;

    std::string id;
    int32_t index = 0;
    std::string title;
    int32_t itemCount = 0;
    double totalTime = 0;
    bool isCurrent = false;
};

struct PlaylistItemInfo
{
    PlaylistItemInfo() = default;

    explicit PlaylistItemInfo(std::vector<std::string> columnsVal)
        : columns(std::move(columnsVal))
    {
    }

    PlaylistItemInfo(PlaylistItemInfo&&) = default;
    PlaylistItemInfo& operator=(PlaylistItemInfo&&) = default;

    std::vector<std::string> columns;
};

struct PlayQueueItemInfo
{
    PlayQueueItemInfo(
        std::string playlistIdVal,
        int32_t playlistIndexVal,
        int32_t itemIndexVal,
        std::vector<std::string> columnsVal = std::vector<std::string>())
        : playlistId(std::move(playlistIdVal)),
          playlistIndex(playlistIndexVal),
          itemIndex(itemIndexVal),
          columns(std::move(columnsVal))
    {
    }

    PlayQueueItemInfo(PlayQueueItemInfo&&) = default;
    PlayQueueItemInfo& operator=(PlayQueueItemInfo&&) = default;

    std::string playlistId;
    int32_t playlistIndex;
    int32_t itemIndex;
    std::vector<std::string> columns;
};

struct PlaylistItemsResult
{
    PlaylistItemsResult(
        int32_t offsetVal,
        int32_t totalCountVal,
        std::vector<PlaylistItemInfo> itemsVal)
        : offset(offsetVal),
          totalCount(totalCountVal),
          items(std::move(itemsVal))
    {
    }

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
        : index_(-1), id_()
    {
    }

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

    int32_t index() const
    {
        return index_;
    }

    const std::string& id() const
    {
        return id_;
    }

private:
    int32_t index_;
    std::string id_;
};

class ColumnsQuery
{
public:
    ColumnsQuery() = default;
    virtual ~ColumnsQuery() = default;

    MSRV_NO_COPY_AND_ASSIGN(ColumnsQuery);
};

struct ArtworkQuery
{
    PlaylistRef playlist;
    int32_t index;
};

struct ArtworkResult
{
    ArtworkResult() = default;

    explicit ArtworkResult(std::string filePathVal)
        : filePath(std::move(filePathVal))
    {
    }

    explicit ArtworkResult(std::vector<uint8_t> fileDataVal)
        : fileData(std::move(fileDataVal))
    {
    }

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

class PlayerOption
{
public:
    PlayerOption(std::string id, std::string name)
        : id_(std::move(id)), name_(std::move(name))
    {
    }

    virtual ~PlayerOption() = default;

    const std::string& id() const
    {
        return id_;
    }

    const std::string& name() const
    {
        return name_;
    }

private:
    const std::string id_;
    const std::string name_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerOption);
};

class BoolPlayerOption : public PlayerOption
{
public:
    BoolPlayerOption(std::string id, std::string name)
        : PlayerOption(std::move(id), std::move(name))
    {
    }

    virtual bool getValue() const = 0;
    virtual void setValue(bool value) = 0;

    void setValue(Switch value)
    {
        switch (value)
        {
        case Switch::SW_FALSE:
            setValue(false);
            break;

        case Switch::SW_TRUE:
            setValue(true);
            break;

        case Switch::SW_TOGGLE:
            setValue(!getValue());
            break;
        }
    }
};

class EnumPlayerOption : public PlayerOption
{
public:
    EnumPlayerOption(std::string id, std::string name, std::vector<std::string> enumNames)
        : PlayerOption(std::move(id), std::move(name)), enumNames_(std::move(enumNames))
    {
    }

    const std::vector<std::string>& enumNames() const
    {
        return enumNames_;
    }

    void validate(int32_t value)
    {
        if (value < 0 || static_cast<size_t>(value) >= enumNames_.size())
            throw InvalidRequestException("value for option '" + id() + "' is out of range");
    }

    virtual int32_t getValue() const = 0;
    virtual void setValue(int32_t value) = 0;

private:
    const std::vector<std::string> enumNames_;
};

namespace default_output {
constexpr char typeId[] = "output";
constexpr char typeName[] = "Output";
constexpr char deviceId[] = "default";
constexpr char deviceName[] = "Default audio device";
}

struct OutputDeviceInfo
{
    OutputDeviceInfo() = default;
    OutputDeviceInfo(OutputDeviceInfo&&) = default;
    OutputDeviceInfo(const OutputDeviceInfo&) = default;
    OutputDeviceInfo(std::string idVal, std::string nameVal)
        : id(std::move(idVal)), name(std::move(nameVal)) { }

    std::string id;
    std::string name;

    OutputDeviceInfo& operator=(OutputDeviceInfo&&) = default;
};

struct OutputTypeInfo
{
    OutputTypeInfo() = default;
    OutputTypeInfo(OutputTypeInfo&&) = default;
    OutputTypeInfo(std::string idVal, std::string nameVal, std::vector<OutputDeviceInfo> devicesVal)
        : id(std::move(idVal)), name(std::move(nameVal)), devices(std::move(devicesVal)) { }

    std::string id;
    std::string name;
    std::vector<OutputDeviceInfo> devices;

    OutputTypeInfo& operator=(OutputTypeInfo&&) = default;
};

struct ActiveOutputInfo
{
    ActiveOutputInfo() = default;
    ActiveOutputInfo(ActiveOutputInfo&&) = default;

    ActiveOutputInfo(std::string typeIdVal, std::string deviceIdVal)
        : typeId(std::move(typeIdVal)), deviceId(std::move(deviceIdVal))
    {
    }

    std::string typeId;
    std::string deviceId;

    bool operator==(const ActiveOutputInfo& other) const
    {
        return typeId == other.typeId && deviceId == other.deviceId;
    }

    bool operator!=(const ActiveOutputInfo& other) const
    {
        return !(*this == other);
    }

    ActiveOutputInfo& operator=(ActiveOutputInfo&&) = default;
};

struct OutputsInfo
{
    OutputsInfo() = default;
    OutputsInfo(OutputsInfo&&) = default;

    ActiveOutputInfo active;
    std::vector<OutputTypeInfo> types;
    bool supportsMultipleOutputTypes = false;

    OutputsInfo& operator=(OutputsInfo&&) = default;

    static OutputsInfo defaultInfo()
    {
        OutputsInfo info;
        std::vector<OutputDeviceInfo> devices{OutputDeviceInfo(default_output::deviceId, default_output::deviceName)};
        info.active = ActiveOutputInfo(default_output::typeId, default_output::deviceId);
        info.types.emplace_back(default_output::typeId, default_output::typeName, std::move(devices));
        return info;
    }
};

using PlayerStatePtr = std::unique_ptr<PlayerState>;
using ColumnsQueryPtr = std::unique_ptr<ColumnsQuery>;
using PlayerEventsCallback = std::function<void(PlayerEvents)>;

class Player
{
public:
    Player() = default;
    virtual ~Player() = default;

    virtual const char* name() = 0;
    virtual std::unique_ptr<WorkQueue> createWorkQueue() = 0;

    // Player control and query API

    virtual PlayerStatePtr queryPlayerState(ColumnsQuery* activeItemQuery) = 0;

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
    virtual void volumeStep(int direction) = 0;

    const std::vector<PlayerOption*>& options()
    {
        return options_;
    }

    PlayerOption* getOption(const std::string& id)
    {
        for (auto option : options_)
        {
            if (option->id() == id)
            {
                return option;
            }
        }

        throw InvalidRequestException("invalid option id: " + id);
    }

    EnumPlayerOption* playbackModeOption()
    {
        return playbackModeOption_;
    }

    virtual ColumnsQueryPtr createColumnsQuery(const std::vector<std::string>& columns) = 0;

    // Playlists API

    virtual PlaylistInfo getPlaylist(const PlaylistRef& plref) = 0;
    virtual std::vector<PlaylistInfo> getPlaylists() = 0;
    virtual PlaylistItemsResult getPlaylistItems(const PlaylistRef& plref, const Range& range, ColumnsQuery* query) = 0;

    virtual PlaylistInfo addPlaylist(int32_t index, const std::string& title, bool setCurrent) = 0;
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

    // Play queue API

    virtual std::vector<PlayQueueItemInfo> getPlayQueue(ColumnsQuery* query = nullptr) = 0;
    virtual void addToPlayQueue(const PlaylistRef& plref, int32_t itemIndex, int32_t queueIndex) = 0;
    virtual void removeFromPlayQueue(int32_t queueIndex) = 0;
    virtual void removeFromPlayQueue(const PlaylistRef& plref, int32_t itemIndex) = 0;
    virtual void clearPlayQueue() = 0;

    // Output API

    virtual OutputsInfo getOutputs()
    {
        return OutputsInfo::defaultInfo();
    }

    virtual void setOutputDevice(const std::string& typeId, const std::string& deviceId)
    {
        (void) typeId;
        (void) deviceId;
    }

    // Artwork API

    virtual boost::unique_future<ArtworkResult> fetchCurrentArtwork() = 0;
    virtual boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) = 0;

    // Events API

    void onEvents(PlayerEventsCallback callback)
    {
        eventsCallback_ = std::move(callback);
    }

protected:
    void addOption(PlayerOption* option)
    {
        assert(option);
        options_.push_back(option);
    }

    void setPlaybackModeOption(EnumPlayerOption* option)
    {
        assert(option);
        playbackModeOption_ = option;
    }

    void queryOptions(PlayerState* state)
    {
        state->options = &options_;
        state->playbackModeOption = playbackModeOption_;
    }

    void emitEvents(PlayerEvents events)
    {
        if (events != PlayerEvents::NONE && eventsCallback_)
            eventsCallback_(events);
    }

private:
    PlayerEventsCallback eventsCallback_;
    std::vector<PlayerOption*> options_;
    EnumPlayerOption* playbackModeOption_ = nullptr;

    MSRV_NO_COPY_AND_ASSIGN(Player);
};

}
