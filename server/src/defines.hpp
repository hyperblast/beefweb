#pragma once

#define MSRV_FORMAT_FUNC(fmt, args) \
    __attribute__((format(printf, fmt, args)))

#define MSRV_NO_COPY_AND_ASSIGN(type) \
    type(const type&) = delete; \
    type& operator=(const type&) = delete

#define MSRV_PROJECT_ID         "beefweb"
#define MSRV_PROJECT_NAME       "Beefweb"
#define MSRV_PREFIXED(name)     beefweb_ ## name
#define MSRV_WEB_ROOT           "beefweb.root"
#define MSRV_PROJECT_DESC       "Provides web UI and HTTP API for controlling player remotely"
#define MSRV_PROJECT_URL        "https://github.com/hyperblast/beefweb"

#define MSRV_LICENSE_TEXT \
    "Copyright 2015-2018 Hyperblast\n" \
    "\n" \
    "Permission is hereby granted, free of charge, to any person obtaining a copy\n" \
    "of this software and associated documentation files (the \"Software\"), to deal\n" \
    "in the Software without restriction, including without limitation the rights\n" \
    "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n" \
    "copies of the Software, and to permit persons to whom the Software is\n" \
    "furnished to do so, subject to the following conditions:\n" \
    "\n" \
    "The above copyright notice and this permission notice shall be included in\n" \
    "all copies or substantial portions of the Software.\n" \
    "\n" \
    "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n" \
    "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n" \
    "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n" \
    "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n" \
    "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n" \
    "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n" \
    "THE SOFTWARE.\n"
