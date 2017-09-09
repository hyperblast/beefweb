#include "server.hpp"
#include "router.hpp"
#include "request_filter.hpp"
#include "work_queue.hpp"
#include "settings.hpp"

#include <catch.hpp>
#include <boost/thread/future.hpp>

namespace msrv {
namespace server_tests {

TEST_CASE("server works")
{
    boost::promise<std::string> startedPromise;
    boost::unique_future<std::string> started = startedPromise.get_future();

    Router router;
    ImmediateWorkQueue workQueue;
    RequestFilterChain filters;
    filters.addFilter(RequestFilterPtr(new ExecuteHandlerFilter()));

    ServerPtr server = Server::create(
        &router, &filters, &workQueue, [&startedPromise] (const SettingsData& s) {
            startedPromise.set_value(s.musicDirs.front());
        });

    SettingsData settings;
    settings.port = 8882;
    settings.musicDirs.push_back("hello");
    server->restart(settings);

    for (int i = 0; i < 10 && !started.is_ready(); i++)
        std::this_thread::sleep_for(std::chrono::milliseconds(100));

    REQUIRE(started.is_ready());

    std::string startedResult = started.get();

    REQUIRE(startedResult == "hello");
}

}}
