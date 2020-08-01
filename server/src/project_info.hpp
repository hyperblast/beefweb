#pragma once

#define MSRV_STRINGIFY_(v)      #v
#define MSRV_STRINGIFY(v)       MSRV_STRINGIFY_(v)

#define MSRV_PROJECT_ID         "beefweb"
#define MSRV_PROJECT_NAME       "Beefweb Remote Control"
#define MSRV_WEB_ROOT           "beefweb.root"
#define MSRV_CONFIG_FILE        "beefweb.config.json"
#define MSRV_CONFIG_FILE_ENV    "BEEFWEB_CONFIG_FILE"
#define MSRV_PROJECT_DESC       "Provides web UI and HTTP API for controlling player remotely"
#define MSRV_PROJECT_URL        "https://github.com/hyperblast/beefweb"
#define MSRV_VERSION_MAJOR      0
#define MSRV_VERSION_MINOR      5
#define MSRV_VERSION_FINAL      0

#define MSRV_DEFAULT_PORT       8880
#define MSRV_DEFAULT_TEST_PORT  8882

#define MSRV_DEADBEEF_ENTRY     beefweb_load
#define MSRV_FOOBAR2000_FILE    "foo_beefweb.dll"

#if MSRV_VERSION_FINAL
#define MSRV_VERSION_TYPE "final"
#else
#define MSRV_VERSION_TYPE "dev"
#endif

#ifndef MSRV_GIT_REV
#define MSRV_GIT_REV unknown
#endif

#define MSRV_VERSION_STRING \
    MSRV_STRINGIFY(MSRV_VERSION_MAJOR) "." MSRV_STRINGIFY(MSRV_VERSION_MINOR)

#define MSRV_VERSION_STRING_DETAILED \
    "v" MSRV_VERSION_STRING " " MSRV_VERSION_TYPE " (" MSRV_STRINGIFY(MSRV_GIT_REV) ")"

#ifdef MSRV_OS_POSIX
#define MSRV_ARCHIVE_SUFFIX "tar.gz"
#endif

#ifdef MSRV_OS_WINDOWS
#define MSRV_ARCHIVE_SUFFIX "zip"
#endif

#define MSRV_LICENSE_TEXT \
    "Copyright 2015-2020 Hyperblast\n" \
    "\n" \
    "Permission is hereby granted, free of charge, to any person obtaining a copy " \
    "of this software and associated documentation files (the \"Software\"), to deal " \
    "in the Software without restriction, including without limitation the rights " \
    "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell " \
    "copies of the Software, and to permit persons to whom the Software is " \
    "furnished to do so, subject to the following conditions:\n" \
    "\n" \
    "The above copyright notice and this permission notice shall be included in " \
    "all copies or substantial portions of the Software.\n" \
    "\n" \
    "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR " \
    "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, " \
    "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE " \
    "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER " \
    "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, " \
    "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN " \
    "THE SOFTWARE.\n" \
    "\n" \
    "See provided file beefweb.licenses." MSRV_ARCHIVE_SUFFIX \
    " for details about third-party libraries used and their licensing conditions.\n"
