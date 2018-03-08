#include "playlist_mapping.hpp"
#include "../string_utils.hpp"

#include <inttypes.h>

namespace msrv {
namespace player_foobar2000 {

namespace {

// {E937900E-EF79-4574-81B1-2A840C1741CC}
const GUID ID_PROPERTY = { 0xe937900e, 0xef79, 0x4574, { 0x81, 0xb1, 0x2a, 0x84, 0xc, 0x17, 0x41, 0xcc } };

const char PLAYLIST_ID_FORMAT[] = "p%" PRId64;
const char INVALID_PLAYLIST_REF[] = "invalid playlist reference";
const char PLAYLIST_INDEX_OUT_OF_RANGE[] = "playlist index is out of range";
const char UNKNOWN_PLAYLIST_ID[] = "unknown playlist id";

}

PlaylistMapping::PlaylistMapping()
    : playlistManager_(playlist_manager_v4::get()),
      maxId_(0)
{
}

PlaylistMapping::~PlaylistMapping()
{
}

bool PlaylistMapping::readId(t_size index, pfc::array_t<char>* buffer)
{
    return playlistManager_->playlist_get_property(index, ID_PROPERTY, *buffer);
}

void PlaylistMapping::writeId(t_size index, const void* data, t_size size)
{
    playlistManager_->playlist_set_property(
        index, ID_PROPERTY,
        &stream_reader_memblock_ref(data, size),
        size,
        abort_callback_dummy());
}

void PlaylistMapping::initialize()
{
    pfc::array_t<char> buffer;
    t_size count = playlistManager_->get_playlist_count();

    for (t_size i = 0; i < count; i++)
    {
        if (!readId(i, &buffer))
            continue;

        buffer.append_single_val('\0');
        int64_t id = 0;
        sscanf(buffer.get_ptr(), PLAYLIST_ID_FORMAT, &id);

        if (id > maxId_)
            maxId_ = id;
    }

    for (t_size i = 0; i < count; i++)
        getId(i);
}

std::string PlaylistMapping::getId(t_size index)
{
    pfc::array_t<char> readBuffer;

    if (readId(index, &readBuffer))
        return std::string(readBuffer.get_ptr(), readBuffer.get_size());

    char writeBuffer[32];
    auto size = sprintf(writeBuffer, PLAYLIST_ID_FORMAT, ++maxId_);
    writeId(index, writeBuffer, size);

    return std::string(writeBuffer, size);
}

t_size PlaylistMapping::resolve(const PlaylistRef& plref)
{
    switch (plref.type())
    {
        case PlaylistRefType::INDEX:
        {
            auto index = plref.index();

            if (index >= 0 && static_cast<t_size>(index) < playlistManager_->get_playlist_count())
                return index;

            throw InvalidRequestException(PLAYLIST_INDEX_OUT_OF_RANGE);
        }

        case PlaylistRefType::ID:
        {
            const auto& id = plref.id();

            if (id == "current")
                return playlistManager_->get_active_playlist();

            pfc::array_t<char> buffer;
            auto count = playlistManager_->get_playlist_count();

            for (t_size i = 0; i < count; i++)
            {
                if (!readId(i, &buffer))
                    continue;

                StringView currentId(buffer.get_ptr(), buffer.get_size());

                if (id == currentId)
                    return i;
            }

            throw InvalidRequestException(UNKNOWN_PLAYLIST_ID);
        }

        default:
            throw InvalidRequestException(INVALID_PLAYLIST_REF);
    }
}

}}
