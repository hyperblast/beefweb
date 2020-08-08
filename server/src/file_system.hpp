#pragma once

#include "system.hpp"
#include "charset.hpp"

#include <stddef.h>
#include <string>
#include <vector>

#include <boost/filesystem.hpp>
#include <boost/algorithm/string.hpp>
#include <boost/optional.hpp>

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

inline std::string pathToUtf8(const Path& path)
{
#ifdef MSRV_OS_POSIX
    return localeToUtf8(path.native());
#endif

#ifdef MSRV_OS_WINDOWS
    return utf16To8(path.native());
#endif
}

inline Path pathFromUtf8(const std::string& path)
{
#ifdef MSRV_OS_POSIX
    return Path(utf8ToLocale(path));
#endif

#ifdef MSRV_OS_WINDOWS
    return Path(utf8To16(path));
#endif
}

bool isSubpath(const Path& parentPath, const Path& childPath);

Path getModulePath(void* symbol);
Path getUserConfigDir();
Path getEnvAsPath(const char* env);

namespace file_io {

FileInfo queryInfo(FileHandle::Type handle);
FileInfo queryInfo(const Path& path);
boost::optional<FileInfo> tryQueryInfo(const Path& path);

FileHandle open(const Path& path);
void setPosition(FileHandle::Type handle, int64_t position);
size_t read(FileHandle::Type handle, void* buffer, size_t bytes);

std::vector<uint8_t> readToEnd(FileHandle::Type handle, int64_t maxBytes = -1);

}

}
