#pragma once

#include "system.hpp"

#include <string>
#include <boost/filesystem.hpp>

namespace msrv {

namespace fs = boost::filesystem;

using Path = fs::path;

enum class FileType
{
    UNKNOWN,
    REGULAR,
    DIRECTORY,
};

struct FileInfo
{
    FileType type;
    int64_t size;
    int64_t timestamp;
    int64_t inode;
};

std::string pathToUtf8(const Path& path);
Path pathFromUtf8(const std::string& path);
Path getModulePath(void* symbol);

FileHandle openFile(const Path& path);
FileInfo queryFileInfo(FileHandle& handle);
FileInfo queryFileInfo(const Path& path);

}
