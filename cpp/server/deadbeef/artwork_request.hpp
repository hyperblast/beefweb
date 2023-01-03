#pragma once

#include "../file_system.hpp"
#include "../player_api.hpp"

#include "common.hpp"

#include <boost/smart_ptr/intrusive_ptr.hpp>
#include <boost/smart_ptr/intrusive_ref_counter.hpp>
#include <boost/thread/future.hpp>

namespace msrv {
namespace player_deadbeef {

class ArtworkRequest
    : public boost::intrusive_ref_counter<ArtworkRequest, boost::thread_safe_counter>
{
public:
    static boost::intrusive_ptr<ArtworkRequest> create(
        DB_artwork_plugin_t* artworkPlugin,
        std::string artist,
        std::string album,
        std::string filePath)
    {
        return boost::intrusive_ptr<ArtworkRequest>(
            new ArtworkRequest(
                artworkPlugin,
                std::move(artist),
                std::move(album),
                std::move(filePath)));
    }

    static void callback(const char*, const char*, const char*, void* data);

    ~ArtworkRequest();

    boost::unique_future<ArtworkResult> execute();

private:
    ArtworkRequest(
        DB_artwork_plugin_t* plugin,
        std::string artist,
        std::string album,
        std::string filePath)
        : plugin_(plugin),
          artist_(std::move(artist)),
          album_(std::move(album)),
          filePath_(std::move(filePath)) { }

    void complete(const char* fileName, const char* artist, const char* album);

    DB_artwork_plugin_t* plugin_;
    std::string artist_;
    std::string album_;
    std::string filePath_;
    std::string resultPath_;
    boost::promise<ArtworkResult> promise_;

    MSRV_NO_COPY_AND_ASSIGN(ArtworkRequest);
};

}}
