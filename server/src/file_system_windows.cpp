#include "file_system.hpp"
#include <windows.h>

namespace msrv {

namespace {

inline int64_t makeInt64(DWORD high, DWORD low)
{
    return (static_cast<int64_t>(high) << 32) | static_cast<int64_t>(low);
}

inline FileType getFileType(DWORD attributes)
{
    return attributes & FILE_ATTRIBUTE_DIRECTORY
        ? FileType::DIRECTORY
        : FileType::REGULAR;
}

inline int64_t getUnixTimestamp(FILETIME time)
{
    return  makeInt64(time.dwHighDateTime, time.dwLowDateTime) / INT64_C(10000000) - INT64_C(11644473600);
}

}

Path getModulePath(void*)
{
    return Path();
}

FileHandle openFile(const Path&)
{
    return FileHandle();
}

FileInfo queryFileInfo(FileHandle::Type handle)
{
    ::BY_HANDLE_FILE_INFORMATION data;
    auto ret = ::GetFileInformationByHandle(handle, &data);
    throwIfFailed("GetFileInformationByHandle", ret != 0);

    FileInfo info;
    info.inode = -1;
    info.size = makeInt64(data.nFileSizeHigh, data.nFileIndexLow);
    info.type = getFileType(data.dwFileAttributes);
    info.timestamp = getUnixTimestamp(data.ftLastWriteTime);
    return info;
}

FileInfo queryFileInfo(const Path& path)
{
    ::WIN32_FILE_ATTRIBUTE_DATA data;
    auto ret = ::GetFileAttributesExW(path.native().c_str(), GetFileExInfoStandard, &data);
    throwIfFailed("GetFileAttributesExW", ret != 0);

    FileInfo info;
    info.inode = -1;
    info.size = makeInt64(data.nFileSizeHigh, data.nFileSizeLow);
    info.type = getFileType(data.dwFileAttributes);
    info.timestamp = getUnixTimestamp(data.ftLastWriteTime);
    return info;
}

size_t readFile(FileHandle::Type handle, void* buffer, size_t bytes)
{
    DWORD bytesRead;
    auto ret = ::ReadFile(handle, buffer, static_cast<DWORD>(bytes), &bytesRead, nullptr);
    throwIfFailed("ReadFile", ret != 0);
    return bytesRead;
}


}
