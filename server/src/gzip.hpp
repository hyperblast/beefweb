#pragma once

#include <stddef.h>
#include <stdint.h>
#include <vector>

namespace msrv {

bool gzipCompress(const void* data, size_t size, std::vector<uint8_t>* output, size_t maxOutputSize = 0);

}
