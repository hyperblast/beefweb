import ModelBinding from "./model_binding.js";
import ServiceContext from "./service_context.js";
import defaultArt from 'open-iconic/png/musical-note-8x.png';
import React from "react";
import { PlaybackState } from "beefweb-client";
import { bindHandlers } from "./utils.js";

class AlbumArtViewer_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
        this.state.errorPlaylistId = '';
        this.state.errorIndex = -1;

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackState, activeItem } = this.context.playerModel;
        const { playlistId, index } = activeItem;
        return {
            isPlaying: playbackState !== PlaybackState.stopped,
            playlistId,
            index
        };
    }

    handleImageError()
    {
        const { playlistId, index } = this.state;

        this.setState({
            errorPlaylistId: playlistId,
            errorIndex: index,
        });
    }

    render()
    {
        const { isPlaying, playlistId, index, errorPlaylistId, errorIndex } = this.state;
        const showArt = isPlaying && !(playlistId === errorPlaylistId && index === errorIndex);
        const url = showArt
            ? `/api/artwork/${playlistId}/${index}`
            : defaultArt;

        return (
            <div className='panel panel-main album-art-panel'>
                <img
                    className='album-art'
                    src={url} alt='Album art'
                    onError={showArt ? this.handleImageError : null}/>
            </div>
        );
    }
}

export default ModelBinding(AlbumArtViewer_, {
    playerModel: 'change'
});
