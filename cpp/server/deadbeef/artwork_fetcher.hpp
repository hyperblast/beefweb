#include "player_api.hpp"

#include "common.hpp"
#include "utils.hpp"

namespace msrv {
namespace player_deadbeef {

class ArtworkFetcher
{
public:
    virtual ~ArtworkFetcher() = default;

    virtual boost::unique_future<ArtworkResult> fetchArtwork(PlaylistPtr playlist, PlaylistItemPtr item) = 0;

    static std::unique_ptr<ArtworkFetcher> createV1();
    static std::unique_ptr<ArtworkFetcher> createV2();
};

}
}
