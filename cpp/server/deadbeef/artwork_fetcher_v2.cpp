#include "artwork_fetcher.hpp"
#include "boost/smart_ptr/intrusive_ref_counter.hpp"
#include "boost/smart_ptr/intrusive_ptr.hpp"

#include <deadbeef/artwork.h>

namespace msrv {
namespace player_deadbeef {

namespace {
}

std::unique_ptr<ArtworkFetcher> ArtworkFetcher::createV2()
{
    return {};
}

}}
