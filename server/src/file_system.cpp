#include "file_system.hpp"

namespace msrv {
namespace file_io {

std::vector<uint8_t> readToEnd(FileHandle::Type handle, int64_t maxBytes)
{
    size_t bytesToRead = static_cast<size_t>(queryInfo(handle).size);

    if (maxBytes >= 0)
        bytesToRead = std::min(bytesToRead, static_cast<size_t>(maxBytes));

    std::vector<uint8_t> buffer;

    if (bytesToRead == 0)
        return buffer;

    buffer.resize(bytesToRead);

    auto bytesRead = read(handle, buffer.data(), bytesToRead);
    buffer.resize(bytesRead);
    return buffer;

}

}}
