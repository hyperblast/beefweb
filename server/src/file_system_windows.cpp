#include "file_system.hpp"

namespace msrv {

std::string pathToUtf8(const Path&)
{
    return std::string();
}

Path pathFromUtf8(const std::string&)
{
    return Path();
}

Path getModulePath(void*)
{
    return Path();
}

FileHandle openFile(const Path&)
{
    return FileHandle();
}

FileInfo queryFileInfo(FileHandle&)
{
    return FileInfo();
}

FileInfo queryFileInfo(const Path&)
{
    return FileInfo();
}

std::vector<uint8_t> readFileToBuffer(FileHandle&, int64_t)
{
    return std::vector<uint8_t>();
}

}
