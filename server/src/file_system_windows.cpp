#include "file_system.hpp"
#include "safe_windows.h"

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

Path getModulePath(void* symbol)
{
    ::HMODULE module;

    auto ret = ::GetModuleHandleExW(
        GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
        reinterpret_cast<wchar_t*>(symbol),
        &module);

    throwIfFailed("GetModuleHandleExW", ret != 0);

    Path::string_type path;
    path.resize(1024);
    auto size = ::GetModuleFileNameW(module, &path[0], path.length());
    throwIfFailed("GetModuleFileNameW", size > 0 && size < path.length());

    path.resize(static_cast<size_t>(size));
    return Path(std::move(path));
}

FileHandle openFile(const Path& path)
{
    return FileHandle(::CreateFileW(
        path.c_str(),
        GENERIC_READ,
        FILE_SHARE_READ,
        nullptr,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        nullptr));
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
