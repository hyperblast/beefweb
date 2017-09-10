#include "add_items_scope.hpp"
#include "../file_system.hpp"

namespace msrv {
namespace plugin_deadbeef {

AddItemsScope::AddItemsScope(ddb_playlist_t* playlist, int visibility)
    : playlist_(playlist), visibility_(visibility), created_(false), aborted_(0)
{
    assert(playlist);

    created_ = ddbApi->plt_add_files_begin(playlist, visibility) == 0;

    if (!created_)
        throw InvalidRequestException("player is already adding files");
}

AddItemsScope::~AddItemsScope()
{
    if (created_)
        ddbApi->plt_add_files_end(playlist_, visibility_);
}

bool AddItemsScope::add(const std::string& path)
{
    Path nativePath = pathFromUtf8(path);

    return handleAdd(addDir(nativePath.c_str()))
        || handleAdd(addFile(nativePath.c_str()))
        || handleAdd(addPlaylist(nativePath.c_str()));
}

bool AddItemsScope::handleAdd(ddb_playItem_t* item)
{
    if (aborted_)
        throw InvalidRequestException("add operation aborted");

    if (!item)
        return false;

    ddbApi->pl_item_ref(item);
    lastItem_.reset(item);
    return true;
}

ddb_playItem_t* AddItemsScope::addDir(const char* path)
{
    return ddbApi->plt_insert_dir2(
        visibility_, playlist_, lastItem_.get(), path, &aborted_, nullptr, nullptr);
}

ddb_playItem_t* AddItemsScope::addFile(const char* path)
{
    return ddbApi->plt_insert_file2(
        visibility_, playlist_, lastItem_.get(), path, &aborted_, nullptr, nullptr);
}

ddb_playItem_t* AddItemsScope::addPlaylist(const char* path)
{
    return ddbApi->plt_load2(
        visibility_, playlist_, lastItem_.get(), path, &aborted_, nullptr, nullptr);
}

}}
