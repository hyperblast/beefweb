#include "player.hpp"

namespace msrv {
namespace plugin_foobar {

PlayerImpl::PlayerImpl()
{
    workQueue_ = std::make_shared<FoobarWorkQueue>();
    playbackControl_ = fb2k::std_api_get<playback_control>();
}

PlayerImpl::~PlayerImpl()
{
}

WorkQueue* PlayerImpl::workQueue()
{
    return workQueue_.get();
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    return boost::make_future<ArtworkResult>(ArtworkResult());
}

}}
