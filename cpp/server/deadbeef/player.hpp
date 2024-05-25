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

class PlayerImpl : public Player
{
public:
    static void endModifyPlaylist(ddb_playlist_t* playlist);

    PlayerImpl();
    ~PlayerImpl() override;

    std::unique_ptr<WorkQueue> createWorkQueue() override;

    PlayerStatePtr queryPlayerState(TrackQuery* activeItemQuery = nullptr) override;

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

    void setMuted(Switch val) override;
    void seekAbsolute(double offsetSeconds) override;
    void seekRelative(double offsetSeconds) override;
    void setVolume(double val) override;

    TrackQueryPtr createTrackQuery(
        const std::vector<std::string>& columns) override;

    std::vector<PlaylistInfo> getPlaylists() override;
    PlaylistItemsResult getPlaylistItems(PlaylistQuery* query) override;

    void addPlaylist(int32_t index, const std::string& title) override;
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

    PlaylistQueryPtr createPlaylistQuery(
        const PlaylistRef& playlist,
        const Range& range,
        const std::vector<std::string>& columns) override;

    boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) override;

    void connect();
    void disconnect();
    void handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

private:
    using PlaylistItemSelector = DB_playItem_t* (*)(DB_playItem_t*, int);

    PlaybackState getPlaybackState(ddb_playItem_t* activeItem);
    void queryActiveItem(ActiveItemInfo* info, ddb_playItem_t* activeItem, TrackQuery* query);
    void queryVolume(VolumeInfo* info);
    void queryInfo(PlayerInfo* info);
    void initVersion();
    void initArtwork();
    bool playNextBy(const std::string& expression, PlaylistItemSelector selector);

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

    MSRV_NO_COPY_AND_ASSIGN(PlayerImpl);
};

}
