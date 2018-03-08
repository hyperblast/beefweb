#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

PlayerImpl::PlayerImpl()
    : playbackControl_(playback_control::get()),
      playlistManager_(playlist_manager_v4::get()),
      workQueue_(new service_impl_t<Fb2kWorkQueue>)
{
    auto callback = [this] (PlayerEvent ev) { emitEvent(ev); };

    playerEventAdapter_.setCallback(callback);
    playlistEventAdapter_.setCallback(callback);
}

PlayerImpl::~PlayerImpl()
{
}

WorkQueue* PlayerImpl::workQueue()
{
    return workQueue_.get_ptr();
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    return boost::make_future<ArtworkResult>(ArtworkResult());
}

}}
