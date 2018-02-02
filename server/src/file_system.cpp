#include "file_system.hpp"

namespace msrv {

std::vector<uint8_t> readFileToEnd(FileHandle::Type handle, int64_t maxBytes)
{
    size_t bytesToRead = static_cast<size_t>(queryFileInfo(handle).size);

    if (maxBytes >= 0)
        bytesToRead = std::min(bytesToRead, static_cast<size_t>(maxBytes));

    std::vector<uint8_t> buffer;

    if (bytesToRead == 0)
        return buffer;

    buffer.resize(bytesToRead);

    auto bytesRead = readFile(handle, buffer.data(), bytesToRead);
    buffer.resize(bytesRead);
    return buffer;
}

}