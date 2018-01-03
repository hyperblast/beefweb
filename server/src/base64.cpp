#include "base64.hpp"

extern "C" {
#include "b64_cdecode.h"
}

namespace msrv {

std::string base64Decode(const std::string& input)
{
    std::string output;
    output.resize((input.size() / 4 + 1) * 3);

    base64_decodestate state;
    base64_init_decodestate(&state);

    int outputSize = base64_decode_block(
        input.data(), static_cast<int>(input.size()), &output[0], &state);

    output.resize(static_cast<size_t>(outputSize));
    return output;
}

}
