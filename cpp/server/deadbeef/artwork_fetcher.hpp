#include "common.hpp"
#include "../player_api.hpp"

namespace msrv {
namespace player_deadbeef {

class ArtworkFetcher
{
public:
    virtual ~ArtworkFetcher() = default;

    virtual boost::unique_future<ArtworkResult> fetchArtwork(
        std::string artist, std::string album, std::string filePath) = 0;

    static std::unique_ptr<ArtworkFetcher> createV1();
    static std::unique_ptr<ArtworkFetcher> createV2();
};

}}
