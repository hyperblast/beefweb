#include "player.hpp"

namespace msrv {
namespace plugin_foobar {

PlayerImpl::PlayerImpl()
{
    workQueue_ = std::make_shared<FoobarWorkQueue>();
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
