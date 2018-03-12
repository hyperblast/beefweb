#pragma once

#include "../defines.hpp"
#include "../file_system.hpp"
#include "../work_queue.hpp"
#include "../player_api.hpp"

#include "utils.hpp"
#include "playlist_mapping.hpp"

namespace msrv {
namespace player_deadbeef {

class PlayerImpl : public Player
{
public:
    PlayerImpl();
    ~PlayerImpl();

    virtual WorkQueue* workQueue() override;

    virtual PlayerStatePtr queryPlayerState(TrackQuery* activeItemQuery = nullptr) override;

    virtual void playCurrent() override;
    virtual void playItem(const PlaylistRef& playlist, int32_t itemIndex) override;
    virtual void playRandom() override;
    virtual void playNext() override;
    virtual void playPrevious() override;
    virtual void stop() override;
    virtual void pause() override;
    virtual void togglePause() override;

    virtual void setMuted(Switch val) override;
    virtual void seekAbsolute(double offsetSeconds) override;
    virtual void seekRelative(double offsetSeconds) override;
    virtual void setVolume(double val) override;
    virtual void setPlaybackMode(int32_t val) override;

    virtual TrackQueryPtr createTrackQuery(
        const std::vector<std::string>& columns) override;

    virtual std::vector<PlaylistInfo> getPlaylists() override;
    virtual std::vector<PlaylistItemInfo> getPlaylistItems(PlaylistQuery* query) override;

    virtual void addPlaylist(int32_t index, const std::string& title) override;
    virtual void removePlaylist(const PlaylistRef& playlist) override;
    virtual void movePlaylist(const PlaylistRef& playlist, int32_t index) override;
    virtual void clearPlaylist(const PlaylistRef& playlist) override;
    virtual void setCurrentPlaylist(const PlaylistRef& playlist) override;
    virtual void setPlaylistTitle(const PlaylistRef& playlist, const std::string& title) override;

    virtual boost::unique_future<void> addPlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<std::string>& items,
        int32_t targetIndex) override;

    virtual void copyPlaylistItems(
        const PlaylistRef& sourcePlaylist,
        const PlaylistRef& targetPlaylist,
        const std::vector<int32_t>& sourceItemIndexes,
        int32_t targetIndex) override;

    virtual void movePlaylistItems(
        const PlaylistRef& sourcePlaylist,
        const PlaylistRef& targetPlaylist,
        const std::vector<int32_t>& sourceItemIndexes,
        int32_t targetIndex) override;

    virtual void removePlaylistItems(
        const PlaylistRef& playlist,
        const std::vector<int32_t>& itemIndexes) override;

    virtual void sortPlaylist(
        const PlaylistRef& plref,
        const std::string& expression,
        bool descending) override;

    virtual void sortPlaylistRandom(const PlaylistRef& plref) override;

    virtual PlaylistQueryPtr createPlaylistQuery(
        const PlaylistRef& playlist,
        const Range& range,
        const std::vector<std::string>& columns) override;

    virtual boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) override;

    void connect();
    void disconnect();
    void handleMessage(uint32_t id, uintptr_t ctx, uint32_t p1, uint32_t p2);

private:
    PlaybackState getPlaybackState();
    void queryActiveItem(ActiveItemInfo* info, TrackQuery* query);
    void queryVolume(VolumeInfo* info);
    void initPlaybackModes();
    void setModes(int order, int loop);
    int32_t getPlaybackMode();
    void endModifyPlaylist(ddb_playlist_t* playlist);

    ThreadWorkQueue workQueue_;
    PlaylistMutex playlistMutex_;
    ConfigMutex configMutex_;
    PlaylistMapping playlists_;
    std::vector<std::string> playbackModes_;
    DB_artwork_plugin_t* artworkPlugin_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerImpl);
};

}}
