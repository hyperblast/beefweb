#pragma once

#include "libevent_glue.hpp"

#include "../log.hpp"
#include "../string_utils.hpp"
#include "../server_core.hpp"

#include <stdint.h>

#include <functional>
#include <memory>

#include <boost/optional.hpp>

#include <evhtp.h>

namespace msrv {
namespace server_evhtp {

class EvhtpHost;
class EvhtpRequest;

class EvhtpHost final
{
public:
    explicit EvhtpHost(EventBase* base);
    ~EvhtpHost();

    EventBase* base() { return base_; }
    ::evhtp_s* ptr() { return ptr_; }
    bool isBound() const { return isBound_; }

    void setEventListener(RequestEventListener* listener) { listener_ = listener; }
    bool bind(const char* address, int port, int backlog);
    void unbind();

private:
    friend class EvhtpRequest;

    static void handleRequestReady(evhtp_request_s*, void*) noexcept;

    void notifyDone(EvhtpRequest* request);

    EventBase* base_;
    ::evhtp_s* ptr_;
    RequestEventListener* listener_;
    bool isBound_;

    MSRV_NO_COPY_AND_ASSIGN(EvhtpHost);
};

class EvhtpKeyValueMap final
{
public:
    explicit EvhtpKeyValueMap(evhtp_kvs_t* ptr)
        : ptr_(ptr) { }

    evhtp_kvs_t* ptr() { return ptr_; }

    template<typename T>
    T toMap()
    {
        T map;

        forEach([&map] (std::string key, std::string value)
        {
            map.emplace(std::move(key), std::move(value));
        });

        return map;
    }

    template<typename Func>
    void forEach(Func&& func)
    {
        evhtp_kvs_for_each(ptr(), callbackFor<Func>, &func);
    }

    void set(const std::string& key, const std::string& value);

    template<typename T>
    void fromMap(T& map)
    {
        for (auto& pair : map)
            set(pair.first, pair.second);
    }

private:
    template<typename Func>
    static int callbackFor(evhtp_kv_t* kv, void* funcPtr) noexcept
    {
        auto func = reinterpret_cast<Func*>(funcPtr);

        tryCatchLog([kv, func]
        {
            std::string key;
            std::string value;

            if (tryUnescapeUrl(StringView(kv->key, kv->klen), key) &&
                tryUnescapeUrl(StringView(kv->val, kv->vlen), value))
            {
                (*func)(std::move(key), std::move(value));
            }
        });

        return 0;
    }

    evhtp_kvs_t* ptr_;
};

class EvhtpRequest final : public RequestCore
{
public:
    EvhtpRequest(EvhtpHost* host, evhtp_request_s* req);

    EvhtpHost* host() { return host_; }
    ::evhtp_request_s* ptr() { return ptr_; }

    virtual HttpMethod method() override;
    virtual std::string path() override;
    virtual HttpKeyValueMap headers() override;
    virtual HttpKeyValueMap queryParams() override;
    virtual StringView body() override;
    virtual void releaseResources() override;

    virtual void abort() override;
    virtual void sendResponse(ResponseCorePtr response) override;
    virtual void sendResponseBegin(ResponseCorePtr response) override;
    virtual void sendResponseEnd() override;
    virtual void sendResponseBody(ResponseCore::Body body) override;

private:
    static uint16_t handleDestroy(evhtp_request_s*, void*) noexcept;

    ~EvhtpRequest();

    bool writeBody(ResponseCore::Body body, Evbuffer* buffer);

    EvhtpHost* host_;
    ::evhtp_request_s* ptr_;

    EvhtpKeyValueMap queryParams_;
    EvhtpKeyValueMap inputHeaders_;
    EvhtpKeyValueMap outputHeaders_;

    Evbuffer inputBuffer_;
    Evbuffer outputBuffer_;
    Evbuffer tempBuffer_;

    boost::optional<std::vector<char>> body_;
};

}}
