#pragma once

#include "../log.hpp"
#include "../util.hpp"

#include "libevent.hpp"

#include <stdint.h>

#include <functional>
#include <memory>

#include <evhtp.h>

struct evhtp_s;
struct evhtp_request_s;

namespace msrv {
namespace server_evhtp {

class EvhtpHost;
class EvhtpRequest;

using EvhtpHostPtr = std::unique_ptr<EvhtpHost>;
using EvhtpRequestCallback = std::function<void(EvhtpRequest*)>;

class EvhtpHost
{
public:
    explicit EvhtpHost(EventBase* base);
    ~EvhtpHost();

    EventBase* base() { return base_; }
    ::evhtp_s* ptr() { return ptr_; }

    void onNewRequest(EvhtpRequestCallback callback) { newRequestCallback_ = std::move(callback); }
    void bind(const char* address, int port, int backlog);
    void unbind();

private:
    static void handleNewRequest(evhtp_request_s*, void*);

    EventBase* base_;
    ::evhtp_s* ptr_;
    EvhtpRequestCallback newRequestCallback_;
    bool isBound_;

    MSRV_NO_COPY_AND_ASSIGN(EvhtpHost);
};

class EvhtpKeyValueMap
{
public:
    explicit EvhtpKeyValueMap(evhtp_kvs_t* ptr)
        : ptr_(ptr) { }

    evhtp_kvs_t* ptr() { return ptr_; }

    template<typename T>
    T toMap()
    {
        T map;

        forEach([&map] (std::string key, std::string value) {
            map.emplace(std::move(key), std::move(value));
        });

        return map;
    }

    template<typename Func>
    void forEach(Func func)
    {
        evhtp_kvs_for_each(ptr(), callbackFor<Func>, &func);
    }

    void set(const std::string& key, const std::string& value);

private:
    template<typename Func>
    static int callbackFor(evhtp_kv_t* kv, void* funcPtr) noexcept
    {
        auto func = reinterpret_cast<Func*>(funcPtr);

        tryCatchLog([&]
        {
            std::string key;
            std::string value;

            if (tryUnescapeUrl(StringSegment(kv->key, kv->klen), key) &&
                tryUnescapeUrl(StringSegment(kv->val, kv->vlen), value))
            {
                (*func)(std::move(key), std::move(value));
            }
        });

        return 0;
    }

    evhtp_kvs_t* ptr_;
};

class EvhtpRequest
{
public:
    EvhtpRequest(EvhtpHost* host, evhtp_request_s* req);

    EvhtpHost* host() { return host_; }
    ::evhtp_request_s* ptr() { return ptr_; }

    htp_method method() { return ptr()->method; }
    std::string path() { return ptr()->uri->path->full; }

    EvhtpKeyValueMap* queryParams() { return &queryParams_; }
    EvhtpKeyValueMap* inputHeaders() { return &inputHeaders_; }
    EvhtpKeyValueMap* outputHeaders() { return &outputHeaders_; }

    Evbuffer* inputBuffer() { return &inputBuffer_; }
    Evbuffer* outputBuffer() { return &outputBuffer_; }

    void onDestroy(EvhtpRequestCallback callback) { destroyCallback_ = std::move(callback); }
    void abort();

    void sendResponse(int status) { ::evhtp_send_reply(ptr(), status); }
    void sendResponseBegin(int status) { ::evhtp_send_reply_start(ptr(), status); }
    void sendResponseBody(Evbuffer* buffer) { ::evhtp_send_reply_body(ptr(), buffer->ptr()); }
    void sendResponseEnd() { ::evhtp_send_reply_end(ptr()); }

    int64_t id;

private:
    ~EvhtpRequest();

    static uint16_t handleDestroy(evhtp_request_s*, void*) noexcept;

    EvhtpHost* host_;
    ::evhtp_request_s* ptr_;

    EvhtpKeyValueMap queryParams_;
    EvhtpKeyValueMap inputHeaders_;
    EvhtpKeyValueMap outputHeaders_;

    Evbuffer inputBuffer_;
    Evbuffer outputBuffer_;

    EvhtpRequestCallback destroyCallback_;
};

}}
