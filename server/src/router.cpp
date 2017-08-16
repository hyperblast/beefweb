#include "router.hpp"
#include "util.hpp"

#include <vector>

namespace msrv {
namespace router_internal {

enum class NodeType
{
    STRING,
    PARAMETER,
    LONG_PARAMETER
};

StringSegment prepareUrl(const std::string& path)
{
    StringSegment urlPath(path);
    urlPath.trim(Router::URL_SEP);
    return urlPath;
}

NodeType getNodeType(const StringSegment& item)
{
    if (item.length() >= 2 && item[0] == ':')
    {
        return item[item.length() - 1] == '*'
            ? NodeType::LONG_PARAMETER
            : NodeType::PARAMETER;
    }

    return NodeType::STRING;
}

std::string getNodeValue(NodeType type, const StringSegment& item)
{
    switch (type)
    {
    case NodeType::STRING:
        return item.toString();

    case NodeType::PARAMETER:
        return item.toString(1);

    case NodeType::LONG_PARAMETER:
        return item.toString(1, item.length() - 2);

    default:
        throw std::invalid_argument("invalid node type");
    }
}

class Node
{
public:
    Node(NodeType type, std::string value)
        : type_(type), value_(std::move(value)), factories_((size_t)HttpMethod::COUNT) { }

    ~Node() = default;

    NodeType type() const { return type_; }
    const std::string& value() const { return value_; }

    std::vector<std::unique_ptr<Node>>& children() { return children_; }
    const std::vector<std::unique_ptr<Node>>& children() const { return children_; }

    bool hasRoutes() const { return hasRoutes_; }

    bool matches(NodeType type, const std::string& value) const
    {
        return type_ == type && value_ == value;
    }

    void defineRoute(HttpMethod method, RequestHandlerFactoryPtr factory)
    {
        assert((size_t)method < factories_.size());

        factories_[(size_t)method] = std::move(factory);
        hasRoutes_ = true;
    }

    RequestHandlerFactory* getRoute(HttpMethod method) const
    {
        assert((size_t)method < factories_.size());

        return factories_[(size_t)method].get();
    }

private:
    NodeType type_;
    std::string value_;
    bool hasRoutes_;

    std::vector<std::unique_ptr<RequestHandlerFactory>> factories_;
    std::vector<std::unique_ptr<Node>> children_;

    MSRV_NO_COPY_AND_ASSIGN(Node);
};

}

using namespace router_internal;

RouteResult::RouteResult(RequestHandlerFactory *factoryVal, HttpKeyValueMap paramsVal)
    : factory(factoryVal), params(std::move(paramsVal)), errorResponse()
{
}

RouteResult::RouteResult(ResponsePtr errorResponseVal)
    : factory(nullptr), params(), errorResponse(std::move(errorResponseVal))
{
}

RouteResult::~RouteResult()
{
}

Router::Router()
{
    rootNode_ = std::unique_ptr<Node>(new Node(NodeType::STRING, std::string()));
}

Router::~Router()
{
}

Node* Router::allocateNode(Node* parent, StringSegment& urlPath)
{
    StringSegment item = urlPath.nextToken(URL_SEP);

    if (!item)
        return parent;

    auto type = getNodeType(item);
    auto value = getNodeValue(type, item);

    for (auto& node : parent->children())
    {
        if (node->matches(type, value))
            return allocateNode(node.get(), urlPath);
    }

    parent->children().emplace_back(new Node(type, std::move(value)));
    return allocateNode(parent->children().back().get(), urlPath);
}

const Node* Router::matchNode(const Node* parent, const StringSegment& urlPath, HttpKeyValueMap& params) const
{
    StringSegment path(urlPath);
    StringSegment item = path.nextToken(URL_SEP);

    if (!item)
        return parent;

    for (auto& node : parent->children())
    {
        switch (node->type())
        {
            case NodeType::STRING:
            {
                if (item == node->value())
                    if (auto result = matchNode(node.get(), path, params))
                        return result;

                break;
            }

            case NodeType::PARAMETER:
            {
                params[node->value()] = item.toString();

                if (auto result = matchNode(node.get(), path, params))
                    return result;

                auto it = params.find(node->value());
                assert(it != params.end());
                params.erase(it);

                break;
            }

            case NodeType::LONG_PARAMETER:
            {
                params[node->value()] = urlPath.toString();
                return node.get();
            }
        }
    }

    return nullptr;
}

void Router::defineRoute(HttpMethod method, const std::string& path, RequestHandlerFactoryPtr factory)
{
    auto urlPath = prepareUrl(path);
    auto node = allocateNode(rootNode_.get(), urlPath);
    node->defineRoute(method, std::move(factory));
}

std::unique_ptr<RouteResult> Router::dispatch(const Request* request) const
{
    HttpKeyValueMap params;

    auto node = matchNode(rootNode_.get(), prepareUrl(request->path), params);
    if (!node)
    {
        return std::unique_ptr<RouteResult>(
            new RouteResult(Response::error(HttpStatus::S_404_NOT_FOUND)));
    }

    auto factory = node->getRoute(request->method);
    if (!factory)
    {
        auto status = node->hasRoutes()
            ? HttpStatus::S_405_METHOD_NOT_ALLOWED
            : HttpStatus::S_404_NOT_FOUND;

        return std::unique_ptr<RouteResult>(new RouteResult(Response::error(status)));
    }

    return std::unique_ptr<RouteResult>(new RouteResult(factory, std::move(params)));
}

}
