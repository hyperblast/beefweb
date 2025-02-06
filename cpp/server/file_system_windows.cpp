#include "file_system.hpp"
#include "safe_windows.h"
#include <stdlib.h>

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
    return makeInt64(time.dwHighDateTime, time.dwLowDateTime) / INT64_C(10000000) - INT64_C(11644473600);
}

inline void fileDataToInfo(const ::WIN32_FILE_ATTRIBUTE_DATA* data, FileInfo* info)
{
    info->inode = -1;
    info->size = makeInt64(data->nFileSizeHigh, data->nFileSizeLow);
    info->type = getFileType(data->dwFileAttributes);
    info->timestamp = getUnixTimestamp(data->ftLastWriteTime);
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

Path getUserConfigDir()
{
    auto appData = ::_wgetenv(L"APPDATA");
    if (appData && appData[0])
        return Path(appData);

    return Path();
}

Path getEnvAsPath(const char* env)
{
    auto value = ::_wgetenv(utf8To16(env).c_str());
    if (value && value[0])
        return Path(value);
    return Path();
}

namespace file_io {

FileInfo queryInfo(FileHandle::Type handle)
{
    ::BY_HANDLE_FILE_INFORMATION data;
    auto ret = ::GetFileInformationByHandle(handle, &data);
    throwIfFailed("GetFileInformationByHandle", ret != 0);

    FileInfo info;
    info.inode = -1;
    info.size = makeInt64(data.nFileSizeHigh, data.nFileSizeLow);
    info.type = getFileType(data.dwFileAttributes);
    info.timestamp = getUnixTimestamp(data.ftLastWriteTime);
    return info;
}

boost::optional <FileInfo> tryQueryInfo(const Path& path)
{
    ::WIN32_FILE_ATTRIBUTE_DATA data;
    auto ret = ::GetFileAttributesExW(path.native().c_str(), GetFileExInfoStandard, &data);
    if (ret == 0)
        return boost::none;

    FileInfo info;
    fileDataToInfo(&data, &info);
    return info;
}

FileInfo queryInfo(const Path& path)
{
    ::WIN32_FILE_ATTRIBUTE_DATA data;
    auto ret = ::GetFileAttributesExW(path.native().c_str(), GetFileExInfoStandard, &data);
    throwIfFailed("GetFileAttributesExW", ret != 0);

    FileInfo info;
    fileDataToInfo(&data, &info);
    return info;
}

FileHandle open(const Path& path)
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

size_t read(FileHandle::Type handle, void* buffer, size_t bytes)
{
    DWORD bytesRead;
    auto ret = ::ReadFile(handle, buffer, static_cast<DWORD>(bytes), &bytesRead, nullptr);
    throwIfFailed("ReadFile", ret != 0);
    return bytesRead;
}

void setPosition(FileHandle::Type handle, int64_t position)
{
    LARGE_INTEGER pos;
    pos.QuadPart = position;
    auto ret = ::SetFilePointerEx(handle, pos, nullptr, FILE_BEGIN);
    throwIfFailed("SetFilePointerEx", ret != 0);
}

void write(const Path& path, const std::string& content)
{
    FileHandle handle(::CreateFileW(
        path.c_str(),
        GENERIC_WRITE,
        FILE_SHARE_READ,
        nullptr,
        CREATE_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        nullptr));

    throwIfFailed("CreateFileW", handle);

    DWORD written;
    auto ret = ::WriteFile(handle.get(), content.data(), content.size(), &written, nullptr);
    throwIfFailed("WriteFile", ret && written == content.length());
}

}

}
