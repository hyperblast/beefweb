#pragma once

#include "common.hpp"
#include "../player_api.hpp"
#include "playlist_mapping.hpp"
#include "utils.hpp"

namespace msrv {
namespace player_foobar2000 {

class PlayerImpl : public Player
{
public:
    PlayerImpl();
    virtual ~PlayerImpl();

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
    virtual void setVolumeDb(double val) override;
    virtual void setVolumeAmp(double val) override;

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

private:
    bool isValidItemIndex(t_size playlist, t_size item)
    {
        return item >= 0
            && static_cast<t_size>(item) < playlistManager_->playlist_get_item_count(playlist);
    }

    PlaybackState getPlaybackState();
    void queryVolume(VolumeInfo* volume);
    void queryActiveItem(ActiveItemInfo* info, TrackQuery* query);

    TitleFormatVector compileColumns(const std::vector<std::string>& columns);

    std::vector<std::string> evaluatePlaylistColumns(
        t_size playlist,
        t_size item,
        const TitleFormatVector& compiledColumns,
        pfc::string8* buffer);

    std::vector<std::string> evaluatePlaybackColumns(const TitleFormatVector& compiledColumns);

    service_ptr_t<playback_control> playbackControl_;
    service_ptr_t<playlist_manager_v4> playlistManager_;
    service_ptr_t<titleformat_compiler> titleFormatCompiler_;
    service_ptr_t<Fb2kWorkQueue> workQueue_;

    PlaylistMapping playlists_;
    PlayerEventAdapter playerEventAdapter_;
    PlaylistEventAdapter playlistEventAdapter_;

    MSRV_NO_COPY_AND_ASSIGN(PlayerImpl);
};  

}}
