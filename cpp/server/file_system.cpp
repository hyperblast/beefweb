#include "file_system.hpp"

#include <boost/algorithm/string.hpp>

namespace msrv {

bool isSubpath(const Path& parentPath, const Path& childPath)
{
    if (parentPath.empty() || childPath.empty() || !parentPath.is_absolute() || !childPath.is_absolute())
        return false;

    const auto& parent = parentPath.native();
    const auto& child = childPath.native();

    if (!boost::starts_with(child, parent))
        return false;

    // C:\foo and C:\foo
    if (child.length() == parent.length())
        return true;

    // C:\foo and C:\foo\bar
    if (child[parent.length()] == Path::preferred_separator)
        return true;

    // C:\ and C:\foo
    return parent.back() == Path::preferred_separator
        && child[parent.length() - 1] == Path::preferred_separator;
}

Path getThisModuleDir()
{
    static int dummySymbol = 0;
    static Path path = getModulePath(&dummySymbol).parent_path();
    return path;
}

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

}
}
