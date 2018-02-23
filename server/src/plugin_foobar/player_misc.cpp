#include "player.hpp"

namespace msrv {
namespace plugin_foobar {

PlayerImpl::PlayerImpl()
{
}

PlayerImpl::~PlayerImpl()
{
}

boost::unique_future<ArtworkResult> PlayerImpl::fetchArtwork(const ArtworkQuery& query)
{
    return boost::make_future<ArtworkResult>(ArtworkResult());
}

}}
