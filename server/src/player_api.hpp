#pragma once

#include "util.hpp"
#include "json.hpp"

#include <vector>
#include <string>
#include <memory>
#include <functional>
#include <unordered_map>

#include <boost/thread/future.hpp>

namespace msrv {

using OptionValueMap = std::unordered_map<std::string, std::string>;

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

struct VolumeInfo
{
    double db;
    double dbMin;
    double amp;
    bool isMuted;
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
    PlaybackState playbackState;
    VolumeInfo volume;
    ActiveItemInfo activeItem;
    OptionValueMap options;
};

struct PlaylistInfo
{
    std::string id;
    int32_t index;
    std::string title;
    int32_t itemCount;
    double totalTime;
    bool isCurrent;
};

struct PlaylistItemInfo
{
    std::vector<std::string> columns;
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

class PlayerOption
{
public:
    PlayerOption(std::string name);
    virtual ~PlayerOption();

    const std::string& name() const { return name_; }
    const std::vector<std::string>& values() const { return strValues_; }

    const std::string& get();
    void set(const std::string& value);

protected:
    void defineValue(std::string strValue, int32_t intValue);

    virtual void doSet(int32_t value) = 0;
    virtual int32_t doGet() = 0;

private:
    std::string name_;
    std::vector<std::string> strValues_;
    std::vector<int32_t> intValues_;
};

template<>
struct ValueParser<PlaylistRef>
{
    static bool tryParse(StringSegment segment, PlaylistRef* outVal);
};

struct ArtworkQuery
{
    std::string file;
    std::string artist;
    std::string album;
};

struct ArtworkResult
{
    ArtworkResult() { }
    ArtworkResult(std::string pathVal) : path(std::move(pathVal)) { }

    std::string path;
};

using PlayerStatePtr = std::unique_ptr<PlayerState>;
using TrackQueryPtr = std::unique_ptr<TrackQuery>;
using PlaylistQueryPtr = std::unique_ptr<PlaylistQuery>;
using PlayerEventCallback = std::function<void(PlayerEvent)>;

class Player
{
public:
    Player();
    virtual ~Player();

    virtual PlayerStatePtr queryPlayerState(TrackQuery* activeItemQuery = nullptr) = 0;

    virtual void playCurrent() = 0;
    virtual void playItem(const PlaylistRef& playlist, int32_t itemIndex) = 0;
    virtual void playRandom() = 0;
    virtual void playNext() = 0;
    virtual void playPrevious() = 0;
    virtual void stop() = 0;
    virtual void pause() = 0;
    virtual void togglePause() = 0;

    virtual bool setMuted(Switch val) = 0;
    virtual bool seekAbsolute(double offsetSeconds) = 0;
    virtual bool seekRelative(double offsetSeconds) = 0;
    virtual void setVolumeDb(double val) = 0;
    virtual void setVolumeAmp(double val) = 0;

    virtual std::vector<PlaylistInfo> getPlaylists() = 0;
    virtual std::vector<PlaylistItemInfo> getPlaylistItems(PlaylistQuery* query) = 0;

    virtual void addPlaylist(int32_t index, const std::string& title) = 0;
    virtual void removePlaylist(const PlaylistRef& playlist) = 0;
    virtual void movePlaylist(const PlaylistRef& playlist, int32_t index) = 0;
    virtual void clearPlaylist(const PlaylistRef& playlist) = 0;
    virtual void setCurrentPlaylist(const PlaylistRef& playlist) = 0;
    virtual void setPlaylistTitle(const PlaylistRef& playlist, const std::string& title) = 0;

    virtual boost::unique_future<void> addPlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<std::string>& items,
        int32_t targetIndex) = 0;

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

    virtual TrackQueryPtr createTrackQuery(
        const std::vector<std::string>& columns) = 0;

    virtual PlaylistQueryPtr createPlaylistQuery(
        const PlaylistRef& playlist,
        const Range& range,
        const std::vector<std::string>& columns) = 0;

    virtual boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) = 0;

    PlayerOption* getOption(const std::string& name);
    const std::vector<PlayerOption*>& options() { return options_; }
    OptionValueMap optionValues();

    void onEvent(PlayerEventCallback callback) { eventCallback_ = std::move(callback); }

protected:
    void emitEvent(PlayerEvent event)
    {
        if (eventCallback_)
            eventCallback_(event);
    }

    void addOption(PlayerOption* option)
    {
        options_.push_back(option);
    }

private:
    PlayerEventCallback eventCallback_;
    std::vector<PlayerOption*> options_;

    MSRV_NO_COPY_AND_ASSIGN(Player);
};

}
