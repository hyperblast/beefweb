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
        this.state.hasError = false;

        bindHandlers(this);
    }

    componentDidMount()
    {
        this.context.playerModel.on('trackSwitch', this.handleTrackSwitch);
    }

    componentWillUnmount()
    {
        this.context.playerModel.off('trackSwitch', this.handleTrackSwitch);
    }

    getStateFromModel()
    {
        const { playbackState, activeItem } = this.context.playerModel;
        const { playlistId, index } = activeItem;
        const filePath = activeItem.columns[2];

        return {
            isPlaying: playbackState !== PlaybackState.stopped,
            playlistId,
            index,
            filePath,
        };
    }

    handleTrackSwitch()
    {
        this.setState({ hasError: false });
    }

    handleImageError()
    {
        this.setState({ hasError: true });
    }

    render()
    {
        const { isPlaying, playlistId, index, hasError, filePath } = this.state;
        const hasAlbumArt = isPlaying && index >= 0 && !hasError;

        if (!hasAlbumArt) {
            return (
                <div className='panel panel-main album-art-panel-default'>
                    <Icon name='musical-note' className='album-art-default'/>
                </div>
            );
        }

        const url = `/api/artwork/${playlistId}/${index}?f=${encodeURIComponent(filePath)}`;

        return (
            <div className='panel panel-main album-art-panel'>
                <img className='album-art' src={url} alt='Loading album art...' onError={this.handleImageError} />
            </div>
        );
    }
}

export default ModelBinding(AlbumArtViewer_, {
    playerModel: 'change'
});
