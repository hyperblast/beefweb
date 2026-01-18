#include "playlist_mapping.hpp"

#include "project_info.hpp"
#include "core_types.hpp"

#include <inttypes.h>

namespace msrv {
namespace player_deadbeef {

namespace {
constexpr char PLAYLIST_ID_META[] = MSRV_PROJECT_ID ".unique_id";

constexpr char PLAYLIST_ID_FORMAT[] = "p%" PRId64;

constexpr char INVALID_PLAYLIST_REF[] = "invalid playlist reference";

constexpr char PLAYLIST_INDEX_OUT_OF_RANGE[] = "playlist index is out of range";

constexpr char UNKNOWN_PLAYLIST_ID[] = "unknown playlist id";
}

void PlaylistMapping::initialize()
{
    int count = ddbApi->plt_get_count();

    for (int i = 0; i < count; i++)
    {
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(i));
        if (!playlist)
            continue;

        const char* idString = ddbApi->plt_find_meta(playlist.get(), PLAYLIST_ID_META);
        if (!idString)
            continue;

        int64_t id = 0;

        sscanf(idString, PLAYLIST_ID_FORMAT, &id);

        if (id > maxId_)
            maxId_ = id;
    }

    for (int i = 0; i < count; i++)
    {
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(i));

        if (playlist)
            getId(playlist.get());
    }
}

const char* PlaylistMapping::getId(ddb_playlist_t* playlist)
{
    const char* id = ddbApi->plt_find_meta(playlist, PLAYLIST_ID_META);

    if (id)
        return id;

    char buf[64];
    sprintf(buf, PLAYLIST_ID_FORMAT, ++maxId_);
    ddbApi->plt_replace_meta(playlist, PLAYLIST_ID_META, buf);
    return ddbApi->plt_find_meta(playlist, PLAYLIST_ID_META);
}

PlaylistPtr PlaylistMapping::resolve(const PlaylistRef& plref)
{
    switch (plref.type())
    {
    case PlaylistRefType::INDEX:
    {
        PlaylistPtr playlist(ddbApi->plt_get_for_idx(plref.index()));

        if (playlist)
            return playlist;

        throw InvalidRequestException(PLAYLIST_INDEX_OUT_OF_RANGE);
    }

    case PlaylistRefType::ID:
    {
        if (plref.id() == "current")
            return PlaylistPtr(ddbApi->plt_get_curr());

        int count = ddbApi->plt_get_count();
        for (int i = 0; i < count; i++)
        {
            PlaylistPtr playlist(ddbApi->plt_get_for_idx(i));
            const char* id = ddbApi->plt_find_meta(playlist.get(), PLAYLIST_ID_META);

            if (id && plref.id() == id)
                return playlist;
        }

        throw InvalidRequestException(UNKNOWN_PLAYLIST_ID);
    }

    default:
        throw InvalidRequestException(INVALID_PLAYLIST_REF);
    }
}

int PlaylistMapping::resolveIndex(const PlaylistRef& plref)
{
    switch (plref.type())
    {
    case PlaylistRefType::INDEX:
    {
        if (plref.index() < ddbApi->plt_get_count())
            return plref.index();
        throw InvalidRequestException(PLAYLIST_INDEX_OUT_OF_RANGE);
    }

    case PlaylistRefType::ID:
    {
        if (plref.id() == "current")
            return ddbApi->plt_get_curr_idx();

        int count = ddbApi->plt_get_count();
        for (int i = 0; i < count; i++)
        {
            PlaylistPtr playlist(ddbApi->plt_get_for_idx(i));
            const char* id = ddbApi->plt_find_meta(playlist.get(), PLAYLIST_ID_META);

            if (id && plref.id() == id)
                return i;
        }

        throw InvalidRequestException(UNKNOWN_PLAYLIST_ID);
    }

    default:
        throw InvalidRequestException(INVALID_PLAYLIST_REF);
    }
}

}
}
