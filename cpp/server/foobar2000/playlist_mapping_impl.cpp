#include "playlist_mapping_impl.hpp"
#include "string_utils.hpp"

namespace msrv {
namespace player_foobar2000 {

namespace {

// {E937900E-EF79-4574-81B1-2A840C1741CC}
constexpr GUID ID_PROPERTY = {0xe937900e, 0xef79, 0x4574, {0x81, 0xb1, 0x2a, 0x84, 0xc, 0x17, 0x41, 0xcc}};

}

int32_t PlaylistMappingImpl::getCurrentIndex()
{
    return static_cast<int32_t>(playlistManager_->get_active_playlist());
}

int32_t PlaylistMappingImpl::getCount()
{
    return static_cast<int32_t>(playlistManager_->get_playlist_count());
}

std::string PlaylistMappingImpl::readId(int32_t index)
{
    pfc::array_t<char> buffer;
    return playlistManager_->playlist_get_property(index, ID_PROPERTY, buffer)
        ? std::string(buffer.get_ptr(), buffer.get_size())
        : std::string();
}

void PlaylistMappingImpl::writeId(int32_t index, const std::string& id)
{
    stream_reader_memblock_ref stream{id.data(), id.size()};

    playlistManager_->playlist_set_property(
        index,
        ID_PROPERTY,
        &stream,
        id.size(),
        fb2k::noAbort);
}
}
}
