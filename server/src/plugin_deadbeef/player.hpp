#pragma once

#include "../defines.hpp"
#include "../file_system.hpp"

#include "util.hpp"
#include "playlist_mapping.hpp"
#include "player_options.hpp"

namespace msrv {
namespace plugin_deadbeef {

class PlayerImpl : public Player
{
public:
    PlayerImpl();
    ~PlayerImpl();

    virtual PlayerStatePtr queryPlayerState(TrackQuery* activeItemQuery = nullptr) override;

    virtual void playCurrent() override;
    virtual void playItem(const PlaylistRef& playlist, int32_t itemIndex) override;
    virtual void playRandom() override;
    virtual void playNext() override;
    virtual void playPrevious() override;
    virtual void stop() override;
    virtual void pause() override;
    virtual void togglePause() override;

    virtual bool setMuted(Switch val) override;
    virtual bool seekAbsolute(double offsetSeconds) override;
    virtual bool seekRelative(double offsetSeconds) override;
    virtual void setVolumeDb(double val) override;
    virtual void setVolumeAmp(double val) override;

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

    virtual TrackQueryPtr createTrackQuery(
        const std::vector<std::string>& columns) override;

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
    void endModifyPlaylist(ddb_playlist_t* playlist);

    static void artworkCallback(const char*, const char*, const char* , void* data);

    PlaylistMutex playlistMutex_;
    PlaylistMapping playlists_;
    PlaybackOrderOption orderOption_;
    PlaybackLoopOption loopOption_;
    DB_artwork_plugin_t* artworkPlugin_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerImpl);
};

}}
