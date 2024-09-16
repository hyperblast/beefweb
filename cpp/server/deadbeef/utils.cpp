#include "utils.hpp"

#include "../core_types.hpp"
#include "../string_utils.hpp"

#include <string.h>

namespace msrv {
namespace player_deadbeef {

PlaylistItemPtr resolvePlaylistItem(ddb_playlist_t* playlist, int32_t index)
{
    return index >= 0
           ? PlaylistItemPtr(ddbApi->plt_get_item_for_idx(playlist, index, PL_MAIN))
           : PlaylistItemPtr();
}

std::vector<TitleFormatPtr> compileColumns(
    const std::vector<std::string>& columns, bool throwOnError)
{
    std::vector<TitleFormatPtr> formatters;

    for (auto& column : columns)
    {
        TitleFormatPtr formatter(ddbApi->tf_compile(column.c_str()));

        if (!formatter)
        {
            if (throwOnError)
                throw InvalidRequestException("Failed to compile expression: " + column);

            return std::vector<TitleFormatPtr>();
        }

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

    ddb_tf_context_t context{};
    context._size = sizeof(context);
    context.plt = playlist;
    context.it = item;

    int index = 0;
    char buffer[TITLE_FORMAT_BUFFER_SIZE];

    for (auto& formatter : formatters)
    {
        int size = ddbApi->tf_eval(&context, formatter.get(), buffer, sizeof(buffer));
        if (size < 0)
            throw std::runtime_error("Failed to evaluate expression at index " + toString(index));

        results.emplace_back(buffer, size);
        index++;
    }

    return results;
}

void DeadbeefLogger::log(LogLevel, const char* fmt, va_list va)
{
    std::string format = prefix_ + fmt + "\n";

    ddbApi->vlog_detailed(plugin_, DDB_LOG_LAYER_INFO, format.c_str(), va);
}

}
}
