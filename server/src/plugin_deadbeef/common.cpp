#include "../core_types.hpp"
#include "../log.hpp"

#include "common.hpp"

namespace msrv {
namespace plugin_deadbeef {

DB_functions_t* ddbApi;

PlaylistItemPtr resolvePlaylistItem(ddb_playlist_t* playlist, int32_t index)
{
    return index >= 0
        ? PlaylistItemPtr(ddbApi->plt_get_item_for_idx(playlist, index, PL_MAIN))
        : PlaylistItemPtr();
}

std::vector<TitleFormatPtr> compileColumns(const std::vector<std::string>& columns)
{
    std::vector<TitleFormatPtr> formatters;

    for (auto& column : columns)
    {
        TitleFormatPtr formatter(ddbApi->tf_compile(column.c_str()));

        if (!formatter)
            throw InvalidRequestException("failed to compile expression: " + column);

        formatters.emplace_back(std::move(formatter));
    }

    return formatters;
}

std::vector<std::string> evaluateColumns(
    ddb_playlist_t* playlist,
    ddb_playItem_t* item,
    const std::vector<TitleFormatPtr>& formatters)
{
    std::vector<std::string> results;
    results.reserve(formatters.size());

    ddb_tf_context_t context;

    memset(&context, 0, sizeof(context));
    context._size = sizeof(context);
    context.plt = playlist;
    context.it = item;

    for (auto& formatter : formatters)
    {
        char buffer[1024];
        int size = ddbApi->tf_eval(&context, formatter.get(), buffer, sizeof(buffer));
        if (size >= 0)
            results.emplace_back(buffer, size);
        else
            results.emplace_back("<err>", 5);
    }

    return results;
}

}}
