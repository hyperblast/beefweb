import ModelBinding from "./model_binding.js";
import ServiceContext from "./service_context.js";
import React from "react";
import { PlaybackState } from "beefweb-client";
import { bindHandlers } from "./utils.js";
import { Icon } from "./elements.js";

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
        const hasAlbumArt = isPlaying && index >= 0 && !(playlistId === errorPlaylistId && index === errorIndex);
        const panelClass = hasAlbumArt ? 'album-art-panel' :'album-art-panel-default';

        return (
            <div className={`panel panel-main ${panelClass}`}>
                {
                    hasAlbumArt
                        ? <img className='album-art'
                               src={`/api/artwork/${playlistId}/${index}`}
                               alt='Album art'
                               onError={this.handleImageError}/>
                        : <Icon name='musical-note' className='album-art-default'/>
                }
            </div>
        );
    }
}

export default ModelBinding(AlbumArtViewer_, {
    playerModel: 'change'
});
