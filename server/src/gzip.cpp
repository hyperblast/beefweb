#include "gzip.hpp"

#include <zlib.h>
#include <stdexcept>
#include <string>
#include <memory>

namespace msrv {

namespace {

void throwIfZlibError(int res)
{
    if (res != Z_OK)
        throw std::runtime_error(std::string("zlib error: ") + zError(res));
}

struct DeflateStreamDeleter
{
public:
    void operator()(z_stream* stream)
    {
        ::deflateEnd(stream);
    }
};

}

bool gzipCompress(const void* data, size_t size, std::vector<uint8_t>* output, size_t maxOutputSize)
{
    ::z_stream stream;
    stream.zalloc = nullptr;
    stream.zfree = nullptr;

    int res = deflateInit2(&stream, Z_BEST_COMPRESSION, Z_DEFLATED, 15 + 16, 9, Z_DEFAULT_STRATEGY);
    throwIfZlibError(res);

    std::unique_ptr<z_stream, DeflateStreamDeleter> streamLifetime(&stream);

    if (maxOutputSize == 0)
        maxOutputSize = deflateBound(&stream, size);

    output->resize(maxOutputSize);

    stream.next_in = const_cast<Bytef*>(reinterpret_cast<const Bytef*>(data));
    stream.avail_in = static_cast<uInt>(size);

    stream.next_out = output->data();
    stream.avail_out = static_cast<uInt>(output->size());

    res = ::deflate(&stream, Z_FINISH);
    if (res == Z_STREAM_END)
    {
        output->resize(stream.total_out);
        return true;
    }
    else
    {
        throwIfZlibError(res);
        // Z_OK here means not enought space, give up compression
        return false;
    }
}

}
