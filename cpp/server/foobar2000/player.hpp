#pragma once

#include "common.hpp"
#include "player_options.hpp"
#include "../player_api.hpp"
#include "playlist_mapping.hpp"
#include "utils.hpp"

namespace msrv::player_foobar2000 {

class PlayerImpl : public Player
{
public:
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

    boost::unique_future<ArtworkResult> fetchCurrentArtwork() override;
    boost::unique_future<ArtworkResult> fetchArtwork(const ArtworkQuery& query) override;

private:
    bool isValidItemIndex(t_size playlist, int32_t item)
    {
        return item >= 0
            && static_cast<t_size>(item) < playlistManager_->playlist_get_item_count(playlist);
    }

    PlaybackState getPlaybackState();
    void queryInfo(PlayerInfo* info);
    void queryVolume(VolumeInfo* volume);
    void queryActiveItem(ActiveItemInfo* info, TrackQuery* query);

    TitleFormatVector compileColumns(const std::vector<std::string>& columns);

    std::vector<std::string> evaluatePlaylistColumns(
        t_size playlist,
        t_size item,
        const TitleFormatVector& compiledColumns,
        pfc::string8* buffer);

    std::vector<std::string> evaluatePlaybackColumns(
        const TitleFormatVector& compiledColumns);

    void makeItemsMask(
        t_size playlist,
        const std::vector<int32_t>& indexes,
        pfc::bit_array_flatIndexList* mask);

    bool playNextBy(const std::string& expression, int increment);

    boost::unique_future<ArtworkResult> fetchArtwork(const metadb_handle_ptr& itemHandle) const;

    service_ptr_t<playback_control> playbackControl_;
    service_ptr_t<playlist_manager_v4> playlistManager_;
    service_ptr_t<playlist_incoming_item_filter_v3> incomingItemFilter_;
    service_ptr_t<album_art_manager_v3> albumArtManager_;
    service_ptr_t<titleformat_compiler> titleFormatCompiler_;

    std::shared_ptr<PlaylistMapping> playlists_;
    PlayerEventAdapter playerEventAdapter_;
    PlaylistEventAdapter playlistEventAdapter_;
    PlaybackOrderOption playbackOrderOption_;
    StopAfterCurrentTrackOption stopAfterCurrentTrackOption_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerImpl);
};

}
