#include "../router.hpp"

#include <catch.hpp>

namespace msrv {
namespace router_tests {

class DummyFactoryBase : public RequestHandlerFactory
{
    virtual RequestHandlerPtr createHandler(Request*) override
    {
        return RequestHandlerPtr();
    }

    virtual WorkQueue* workQueue() override
    {
        return nullptr;
    }
};

class GetRoot : public DummyFactoryBase
{
};
class GetSimple : public DummyFactoryBase
{
};
class GetWithParam : public DummyFactoryBase
{
};
class GetWithLongParam : public DummyFactoryBase
{
};
class GetHandler : public DummyFactoryBase
{
};
class PostHandler : public DummyFactoryBase
{
};
class GetPrefix1 : public DummyFactoryBase
{
};
class GetPrefix2 : public DummyFactoryBase
{
};

TEST_CASE("router")
{
    Router router;

    router.defineRoute(HttpMethod::GET, "", std::make_unique<GetRoot>());
    router.defineRoute(HttpMethod::GET, "simple", std::make_unique<GetSimple>());
    router.defineRoute(HttpMethod::GET, "param/:param", std::make_unique<GetWithParam>());
    router.defineRoute(HttpMethod::GET, "lparam/:param*", std::make_unique<GetWithLongParam>());
    router.defineRoute(HttpMethod::GET, "data", std::make_unique<GetHandler>());
    router.defineRoute(HttpMethod::POST, "data", std::make_unique<PostHandler>());

    SECTION("GET root")
    {
        Request request(HttpMethod::GET, "/");
        auto result = router.dispatch(&request);
        REQUIRE(result->factory != nullptr);
        REQUIRE(typeid(*result->factory) == typeid(GetRoot));
    }

    SECTION("GET simple")
    {
        Request request(HttpMethod::GET, "/simple");
        auto result = router.dispatch(&request);
        REQUIRE(result->factory != nullptr);
        REQUIRE(typeid(*result->factory) == typeid(GetSimple));
    }

    SECTION("GET with param")
    {
        Request request(HttpMethod::GET, "/param/hello");
        auto result = router.dispatch(&request);

        REQUIRE(result->factory != nullptr);
        REQUIRE(typeid(*result->factory) == typeid(GetWithParam));

        auto param = result->params.find("param");
        REQUIRE(param != result->params.end());
        REQUIRE(param->second == "hello");
    }

    SECTION("GET with long param")
    {
        Request request(HttpMethod::GET, "/lparam/hello/world");
        auto result = router.dispatch(&request);

        REQUIRE(result->factory != nullptr);
        REQUIRE(typeid(*result->factory) == typeid(GetWithLongParam));

        auto param = result->params.find("param");
        REQUIRE(param != result->params.end());
        REQUIRE(param->second == "hello/world");
    }

    SECTION("GET and POST with different handlers")
    {
        Request getRequest(HttpMethod::GET, "/data");
        auto result = router.dispatch(&getRequest);
        REQUIRE(result->factory != nullptr);
        REQUIRE(typeid(*result->factory) == typeid(GetHandler));

        Request postRequest(HttpMethod::POST, "/data");
        result = router.dispatch(&postRequest);
        REQUIRE(result->factory != nullptr);
        REQUIRE(typeid(*result->factory) == typeid(PostHandler));
    }

    SECTION("get most specific route")
    {
        router.defineRoute(HttpMethod::GET, ":path*", std::make_unique<GetRoot>());
        router.defineRoute(HttpMethod::GET, "prefix/:path*", std::make_unique<GetPrefix1>());
        router.defineRoute(HttpMethod::GET, "prefix/nested/:path*", std::make_unique<GetPrefix2>());

        Request request1(HttpMethod::GET, "/foo");
        Request request2(HttpMethod::GET, "/prefix/foo");
        Request request3(HttpMethod::GET, "/prefix/nested/foo");

        auto result1 = router.dispatch(&request1);
        auto result2 = router.dispatch(&request2);
        auto result3 = router.dispatch(&request3);

        REQUIRE(result1->factory != nullptr);
        REQUIRE(typeid(*result1->factory) == typeid(GetRoot));

        REQUIRE(result1->factory != nullptr);
        REQUIRE(typeid(*result2->factory) == typeid(GetPrefix1));

        REQUIRE(result1->factory != nullptr);
        REQUIRE(typeid(*result3->factory) == typeid(GetPrefix2));
    }
}

}
}
