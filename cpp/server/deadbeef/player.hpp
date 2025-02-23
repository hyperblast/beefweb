#pragma once

#include "../defines.hpp"
#include "../file_system.hpp"
#include "../work_queue.hpp"
#include "../player_api.hpp"

#include "artwork_fetcher.hpp"
#include "utils.hpp"
#include "playlist_mapping.hpp"
#include "player_options.hpp"

namespace msrv::player_deadbeef {

class ColumnsQueryImpl final : public ColumnsQuery
{
public:
    explicit ColumnsQueryImpl(const std::vector<std::string>& columns)
        : columns_(compileColumns(columns))
    {
    }

    ~ColumnsQueryImpl() = default;

    std::vector<std::string> evaluate(ddb_playlist_t* playlist, ddb_playItem_t* item)
    {
        return evaluateColumns(playlist, item, columns_);
    }

private:
    std::vector<TitleFormatPtr> columns_;
};

class PlayerImpl final : public Player
{
public:
    static void endModifyPlaylist(ddb_playlist_t* playlist);

    PlayerImpl();
    ~PlayerImpl() = default;

    const char* name() override;
    std::unique_ptr<WorkQueue> createWorkQueue() override;

    PlayerStatePtr queryPlayerState(ColumnsQuery* activeItemQuery = nullptr) override;

    void playCurrent() override;
    void playItem(const PlaylistRef& playlist, int32_t itemIndex) override;
    void playRandom() override;
    void playNext() override;
    bool playNextBy(const std::string& expression) override;
    void playPrevious() override;
    bool playPreviousBy(const std::string& expression) override;
    void stop() override;
    void pause() override;
    void togglePause() override;
    void playOrPause() override;

    void setMuted(Switch val) override;
    void seekAbsolute(double offsetSeconds) override;
    void seekRelative(double offsetSeconds) override;
    void setVolumeAbsolute(double val) override;
    void setVolumeRelative(double val) override;
    void volumeUp() override;
    void volumeDown() override;

    ColumnsQueryPtr createColumnsQuery(const std::vector<std::string>& columns) override;

    PlaylistInfo getPlaylist(const PlaylistRef& plref) override;
    std::vector<PlaylistInfo> getPlaylists() override;
    PlaylistItemsResult getPlaylistItems(const PlaylistRef& plref, const Range& range, ColumnsQuery* query) override;

    PlaylistInfo addPlaylist(int32_t index, const std::string& title, bool setCurrent) override;
    void removePlaylist(const PlaylistRef& playlist) override;
    void movePlaylist(const PlaylistRef& playlist, int32_t index) override;
    void clearPlaylist(const PlaylistRef& playlist) override;
    void setCurrentPlaylist(const PlaylistRef& playlist) override;
    void setPlaylistTitle(const PlaylistRef& playlist, const std::string& title) override;

    boost::unique_future<void> addPlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<std::string>& items,
        int32_t targetIndex,
        AddItemsOptions options) override;

    void copyPlaylistItems(
        const PlaylistRef& sourcePlaylist,
        const PlaylistRef& targetPlaylist,
        const std::vector<int32_t>& sourceItemIndexes,
        int32_t targetIndex) override;

    void movePlaylistItems(
        const PlaylistRef& sourcePlaylist,
        const PlaylistRef& targetPlaylist,
        const std::vector<int32_t>& sourceItemIndexes,
        int32_t targetIndex) override;

    void removePlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<int32_t>& itemIndexes) override;

    void sortPlaylist(
        const PlaylistRef& plref,
        const std::string& expression,
        bool descending) override;

    void sortPlaylistRandom(const PlaylistRef& plref) override;

    std::vector<PlayQueueItemInfo> getPlayQueue(ColumnsQuery* query = nullptr) override;
    void addToPlayQueue(const PlaylistRef& plref, int32_t itemIndex, int32_t queueIndex) override;
    void removeFromPlayQueue(int32_t queueIndex) override;
    void removeFromPlayQueue(const PlaylistRef& plref, int32_t itemIndex) override;
    void clearPlayQueue() override;

    OutputsInfo getOutputs() override;
    void setOutputDevice(const std::string& typeId, const std::string& deviceId) override;

    boost::unique_future<ArtworkResult> fetchCurrentArtwork() override;
    boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) override;

    void connect();
    void disconnect();
    void handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

private:
    using PlaylistItemSelector = DB_playItem_t* (*)(DB_playItem_t*, int);

    PlaybackState getPlaybackState(ddb_playItem_t* activeItem);
    void queryActiveItem(ActiveItemInfo* info, ddb_playItem_t* activeItem, ColumnsQuery* query);
    void queryVolume(VolumeInfo* info);
    void queryInfo(PlayerInfo* info);
    bool checkOutputChanged();
    ActiveOutputInfo getActiveOutput();
    bool playNextBy(const std::string& expression, PlaylistItemSelector selector);
    PlaylistInfo getPlaylistInfo(ddb_playlist_t* playlist, int index, bool isCurrent);

    PlaylistMutex playlistMutex_;
    ConfigMutex configMutex_;
    PlaylistMapping playlists_;

    LegacyPlaybackModeOption playbackModeOption_;
    ShuffleOption shuffleOption_;
    RepeatOption repeatOption_;
    StopAfterCurrentTrackOption stopAfterCurrentTrackOption_;
    StopAfterCurrentAlbumOption stopAfterCurrentAlbumOption_;

    std::string version_;
    std::unique_ptr<ArtworkFetcher> artworkFetcher_;
    ActiveOutputInfo activeOutput_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerImpl);
};

}
