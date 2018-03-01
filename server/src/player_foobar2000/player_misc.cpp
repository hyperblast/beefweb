#include "player.hpp"

namespace msrv {
namespace player_foobar2000 {

PlayerImpl::PlayerImpl()
    : playbackControl_(playback_control::get()),
      workQueue_(new service_impl_t<Fb2kWorkQueue>)
{
    playerEventAdapter_.setCallback([this](PlayerEvent ev) { emitEvent(ev); });
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
