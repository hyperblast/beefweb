#include "playlist_mapping.hpp"

#include <http.hpp>
#include <stdio.h>
#include <inttypes.h>
#include <log.hpp>

#define PLAYLIST_ID_FORMAT "p%" PRIu64

namespace msrv {

namespace {

uint64_t parseId(const std::string& str)
{
    uint64_t id = 0;
    ::sscanf(str.c_str(), PLAYLIST_ID_FORMAT, &id);
    return id;
}

std::string formatId(const uint64_t id)
{
    char buffer[32];
    snprintf(buffer, sizeof(buffer), PLAYLIST_ID_FORMAT, id);
    return buffer;
}

}

int32_t PlaylistMapping::getIndex(const PlaylistRef& plref)
{
    if (invalid_)
        rebuild();

    switch (plref.type())
    {
    case PlaylistRefType::INDEX:
        if (plref.index() >= 0 && plref.index() < getCount())
            return plref.index();
        throw InvalidRequestException("playlist index is out of range: " + toString(plref.index()));

    case PlaylistRefType::ID:
    default:
        if (plref.isCurrent())
            return getCurrentIndex();
        const auto it = idToIndex_.find(plref.id());
        if (it == idToIndex_.end())
            throw InvalidRequestException("unknown playlist id: " + plref.id());
        return it->second;
    }
}

void PlaylistMapping::rebuild()
{
    idToIndex_.clear();
    allIds_.clear();
    auto count = getCount();

    logDebug("scanning existing ids:");
    for (int32_t index = 0; index < count; index++)
    {
        auto idStr = readId(index);
        const auto id = idStr.empty() ? 0 : parseId(idStr);

        if (!idStr.empty() && idToIndex_.try_emplace(idStr, index).second)
        {
            logDebug("%i -> %s", index, idStr.c_str());
            allIds_.emplace_back(std::move(idStr));
        }
        else
        {
            logDebug("no id or duplicate: %i", index);
            allIds_.emplace_back(); // no id or duplicate
        }

        if (id > maxId_)
            maxId_ = id;
    }

    logDebug("rebuilding index:");
    for (int32_t index = 0; index < count; index++)
    {
        const auto& existingId = allIds_[index];
        if (!existingId.empty())
        {
            logDebug("%s -> %i", existingId.c_str(), index);
            continue;
        }

        const auto id = ++maxId_;
        auto idStr = formatId(id);
        writeId(index, idStr);
        logDebug("%s -> %i", idStr.c_str(), index);
        idToIndex_.emplace(idStr, index);
        allIds_[index] = std::move(idStr);
    }

    invalid_ = false;
}

}
