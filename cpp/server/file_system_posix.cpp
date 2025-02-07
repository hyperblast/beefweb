#include "file_system.hpp"

#include <dlfcn.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

namespace msrv {

namespace {

void statToFileInfo(const struct ::stat& st, FileInfo& info)
{
    if (S_ISREG(st.st_mode))
        info.type = FileType::REGULAR;
    else if (S_ISDIR(st.st_mode))
        info.type = FileType::DIRECTORY;
    else
        info.type = FileType::UNKNOWN;

    info.size = st.st_size;
    info.inode = static_cast<int64_t>(st.st_ino);
    info.timestamp = st.st_mtime;
}

}

Path getModulePath(void* symbol)
{
    ::Dl_info info;

    if (::dladdr(symbol, &info) == 0 || !info.dli_fname)
        throw std::runtime_error("Failed to obtain module file name");

    return Path(info.dli_fname);
}

Path getUserConfigDir()
{
    auto xdgConfigHome = ::getenv("XDG_CONFIG_HOME");
    if (xdgConfigHome && xdgConfigHome[0])
    {
        return Path(xdgConfigHome);
    }

    auto home = ::getenv("HOME");
    if (home && home[0])
    {
        return Path(home) / Path(".config");
    }

    return Path();
}

Path getEnvAsPath(const char* env)
{
    auto value = ::getenv(env);
    if (value && value[0])
        return Path(value);
    return Path();
}

namespace file_io {

boost::optional<FileInfo> tryQueryInfo(const Path& path)
{
    struct ::stat st;
    int ret = ::stat(path.c_str(), &st);
    if (ret < 0)
        return boost::none;

    FileInfo info;
    statToFileInfo(st, info);
    return info;
}

FileInfo queryInfo(const Path& path)
{
    struct ::stat st;
    int ret = ::stat(path.c_str(), &st);
    throwIfFailed("stat", ret >= 0);

    FileInfo info;
    statToFileInfo(st, info);
    return info;
}

FileInfo queryInfo(FileHandle::Type handle)
{
    assert(handle);

    struct ::stat st;
    int ret = ::fstat(handle, &st);
    throwIfFailed("fstat", ret >= 0);

    FileInfo info;
    statToFileInfo(st, info);
    return info;
}

FileHandle open(const Path& path)
{
    return FileHandle(::open(path.c_str(), O_RDONLY | O_CLOEXEC));
}

size_t read(FileHandle::Type handle, void* buffer, size_t bytes)
{
    auto bytesRead = ::read(handle, buffer, bytes);
    throwIfFailed("read", bytesRead >= 0);
    return static_cast<size_t>(bytesRead);
}

void setPosition(FileHandle::Type handle, int64_t position)
{
    auto ret = ::lseek64(handle, position, SEEK_SET);
    throwIfFailed("lseek64", ret >= 0);
}

void write(const Path& path, const void* buffer, size_t bytes)
{
    constexpr auto mode = S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH;
    FileHandle handle(::open(path.c_str(), O_CREAT | O_TRUNC | O_WRONLY | O_CLOEXEC, mode));
    throwIfFailed("open", handle);
    auto written = ::write(handle.get(), buffer, bytes);
    throwIfFailed("write", written == static_cast<ssize_t>(bytes));
}

}

}
