#pragma once

#include "../file_system.hpp"
#include "../player_api.hpp"

#include "common.hpp"

#include <boost/smart_ptr/intrusive_ptr.hpp>
#include <boost/smart_ptr/intrusive_ref_counter.hpp>
#include <boost/thread/future.hpp>

namespace msrv {
namespace plugin_deadbeef {

class ArtworkRequest
    : public boost::intrusive_ref_counter<ArtworkRequest, boost::thread_safe_counter>
{
public:
    static boost::intrusive_ptr<ArtworkRequest> create(DB_artwork_plugin_t* artworkPlugin)
    {
        return boost::intrusive_ptr<ArtworkRequest>(new ArtworkRequest(artworkPlugin));
    }

    static void callback(const char*, const char*, const char*, void* data);

    ~ArtworkRequest();

    boost::unique_future<ArtworkResult> execute(const ArtworkQuery& query);

private:
    ArtworkRequest(DB_artwork_plugin_t* plugin);
    void complete(const char* fileName, const char* artist, const char* album);

    DB_artwork_plugin_t* plugin_;
    std::string cachePath_;
    boost::promise<ArtworkResult> promise_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkRequest);
};

}}
