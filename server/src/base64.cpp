#include "base64.hpp"

#include <modp_b64.h>

namespace msrv {

std::string base64Decode(const std::string& input)
{
    std::string output;

    output.resize(modp_b64_decode_len(input.size()));

    auto outputSize = modp_b64_decode(&output[0], input.data(), input.size());

    if (outputSize == static_cast<size_t>(-1))
    {
        output.resize(0);
        output.shrink_to_fit();
    }
    else
        output.resize(outputSize);

    return output;
}

}
