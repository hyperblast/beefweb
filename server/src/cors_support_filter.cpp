#include "request.hpp"
#include "response.hpp"
#include "cors_support_filter.hpp"

namespace msrv {

CorsSupportFilter::CorsSupportFilter(std::string value) : value_(std::move(value)) {}
CorsSupportFilter::~CorsSupportFilter() = default;

}