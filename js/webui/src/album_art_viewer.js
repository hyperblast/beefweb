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
        this.state.errorFilePath = '';

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackState, activeItem } = this.context.playerModel;

        return {
            isPlaying: playbackState !== PlaybackState.stopped,
            filePath: activeItem.columns[2] || '',
        };
    }

    handleImageError()
    {
        this.setState({ errorFilePath: this.state.filePath });
    }

    render()
    {
        const { isPlaying, filePath, errorFilePath } = this.state;
        const hasAlbumArt = isPlaying && filePath !== errorFilePath;

        if (!hasAlbumArt) {
            return (
                <div className='panel panel-main album-art-panel-default'>
                    <Icon name='musical-note' className='album-art-default'/>
                </div>
            );
        }

        const url = `/api/artwork/current?f=${encodeURIComponent(filePath)}`;

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
