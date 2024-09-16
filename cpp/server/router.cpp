#include "router.hpp"
#include "string_utils.hpp"

#include <vector>

namespace msrv {
namespace router_internal {

enum class NodeType
{
    STRING = 0,
    PARAMETER = 1,
    LONG_PARAMETER = 2
};

StringView prepareUrl(const std::string& path)
{
    return trim(StringView(path), Router::URL_SEP);
}

NodeType getNodeType(const StringView& item)
{
    if (item.length() >= 2 && item[0] == ':')
    {
        return item.back() == '*'
               ? NodeType::LONG_PARAMETER
               : NodeType::PARAMETER;
    }

    return NodeType::STRING;
}

std::string getNodeValue(NodeType type, const StringView& item)
{
    switch (type)
    {
    case NodeType::STRING:
        return item.to_string();

    case NodeType::PARAMETER:
        return item.substr(1).to_string();

    case NodeType::LONG_PARAMETER:
        return item.substr(1, item.length() - 2).to_string();

    default:
        throw std::invalid_argument("invalid node type");
    }
}

class Node
{
public:
    Node(NodeType type, std::string value)
        : type_(type), value_(std::move(value)), factories_((size_t) HttpMethod::COUNT) { }

    ~Node() = default;

    NodeType type() const { return type_; }
    const std::string& value() const { return value_; }

    std::multimap<NodeType, std::unique_ptr<Node>>& children() { return children_; }
    const std::multimap<NodeType, std::unique_ptr<Node>>& children() const { return children_; }

    bool hasRoutes() const { return hasRoutes_; }

    bool matches(NodeType type, const std::string& value) const
    {
        return type_ == type && value_ == value;
    }

    void defineRoute(HttpMethod method, RequestHandlerFactoryPtr factory)
    {
        assert((size_t) method < factories_.size());

        factories_[(size_t) method] = std::move(factory);
        hasRoutes_ = true;
    }

    RequestHandlerFactory* getRoute(HttpMethod method) const
    {
        assert((size_t) method < factories_.size());

        return factories_[(size_t) method].get();
    }

private:
    NodeType type_;
    std::string value_;
    bool hasRoutes_{};

    std::vector<std::unique_ptr<RequestHandlerFactory>> factories_;
    std::multimap<NodeType, std::unique_ptr<Node>> children_;

    MSRV_NO_COPY_AND_ASSIGN(Node);
};

}

using namespace router_internal;

RouteResult::RouteResult(RequestHandlerFactory* factoryVal, HttpKeyValueMap paramsVal)
    : factory(factoryVal), params(std::move(paramsVal)), errorResponse()
{
}

RouteResult::RouteResult(ResponsePtr errorResponseVal)
    : factory(nullptr), params(), errorResponse(std::move(errorResponseVal))
{
}

RouteResult::~RouteResult() = default;

Router::Router()
{
    rootNode_ = std::make_unique<Node>(NodeType::STRING, std::string());
}

Router::~Router() = default;

Node* Router::allocateNode(Node* parent, Tokenizer* urlTokenizer)
{
    if (!urlTokenizer->nextToken())
        return parent;

    auto token = urlTokenizer->token();
    auto type = getNodeType(token);
    auto value = getNodeValue(type, token);

    for (auto& kv: parent->children())
    {
        auto& node = kv.second;

        if (node->matches(type, value))
            return allocateNode(node.get(), urlTokenizer);
    }

    auto item = parent->children().emplace(type, std::make_unique<Node>(type, std::move(value)));
    return allocateNode(item->second.get(), urlTokenizer);
}

const Node* Router::matchNode(const Node* parent, Tokenizer* urlTokenizer, HttpKeyValueMap& params) const
{
    StringView remainingUrlPart = urlTokenizer->input();

    if (!urlTokenizer->nextToken())
        return parent;

    auto item = urlTokenizer->token();

    for (const auto& kv: parent->children())
    {
        const auto& node = kv.second;

        switch (node->type())
        {
        case NodeType::STRING:
        {
            if (item == node->value())
                if (auto result = matchNode(node.get(), urlTokenizer, params))
                    return result;

            break;
        }

        case NodeType::PARAMETER:
        {
            params[node->value()] = item.to_string();

            if (auto result = matchNode(node.get(), urlTokenizer, params))
                return result;

            auto it = params.find(node->value());
            assert(it != params.end());
            params.erase(it);

            break;
        }

        case NodeType::LONG_PARAMETER:
        {
            params[node->value()] = remainingUrlPart.to_string();
            return node.get();
        }
        }
    }

    return nullptr;
}

void Router::defineRoute(HttpMethod method, const std::string& path, RequestHandlerFactoryPtr factory)
{
    Tokenizer urlTokenizer(prepareUrl(path), URL_SEP);
    auto node = allocateNode(rootNode_.get(), &urlTokenizer);
    node->defineRoute(method, std::move(factory));
}

std::unique_ptr<RouteResult> Router::dispatch(const Request* request) const
{
    HttpKeyValueMap params;

    Tokenizer urlTokenizer(prepareUrl(request->path), URL_SEP);

    auto node = matchNode(rootNode_.get(), &urlTokenizer, params);
    if (!node)
        return std::make_unique<RouteResult>(Response::notFound());

    if (request->method == HttpMethod::OPTIONS)
        return std::make_unique<RouteResult>(RequestHandlerFactory::empty(), HttpKeyValueMap());

    auto factory = node->getRoute(request->method);
    if (!factory)
    {
        auto status = node->hasRoutes()
                      ? HttpStatus::S_405_METHOD_NOT_ALLOWED
                      : HttpStatus::S_404_NOT_FOUND;

        return std::make_unique<RouteResult>(Response::error(status));
    }

    return std::make_unique<RouteResult>(factory, std::move(params));
}

}
