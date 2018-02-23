#include "plugin.hpp"
#include "../project_info.hpp"

DECLARE_COMPONENT_VERSION(
    MSRV_PROJECT_ID,
    MSRV_VERSION_STRING,
    MSRV_PROJECT_DESC "\n\n" MSRV_LICENSE_TEXT);

VALIDATE_COMPONENT_FILENAME("foo_beefweb.dll");

namespace msrv {
namespace plugin_foobar {

}}
