import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import DataTable from './data_table'
import { bindHandlers } from './utils'
import { PlaybackState } from './api_client'

const pageSize = 100;

const playbackStateIcons = {
    [PlaybackState.playing]: 'media-play',
    [PlaybackState.paused]: 'media-pause',
    [PlaybackState.stopped]: null,
};

export default class PlaylistContent extends Component
{
    constructor(props)
    {
        super(props);

        this.updateOn({
            playerModel: 'change',
            playlistModel: ['playlistsChange', 'itemsChange']
        });

        this.state = this.getStateFromModel();

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackState } = this.props.playerModel;
        const { columns, playlistItems } = this.props.playlistModel;
        const { offset, totalCount, items } = playlistItems;

        return {
            playbackState,
            columnNames: columns.names,
            columnSizes: columns.sizes,
            offset,
            totalCount,
            items,
            activeItemIndex: this.getActiveItemIndex(),
        };
    }

    getActiveItemIndex()
    {
        const { playerModel, playlistModel } = this.props;
        const { activeItem } = playerModel;

        if (activeItem.playlistId && (
            activeItem.playlistId === playlistModel.currentPlaylistId))
        {
            return activeItem.index;
        }

        return -1;
    }

    handleDoubleClick(index)
    {
        this.props.playlistModel.activateItem(index);
    }

    handleLoadPage(offset)
    {
        this.props.playlistModel.setItemsPage(offset, pageSize);
    }

    getTableData()
    {
        const { playbackState, offset, items, activeItemIndex } = this.state;

        return items.map((item, index) =>
        {
            const icon = (index + offset) === activeItemIndex
                ? playbackStateIcons[playbackState]
                : null;

            const columns = item.columns;

            return { icon, columns };
        });
    }

    render()
    {
        return (
            <DataTable
                useIcons={true}
                columnNames={this.state.columnNames}
                columnSizes={this.state.columnSizes}
                data={this.getTableData()}
                offset={this.state.offset}
                totalCount={this.state.totalCount}
                pageSize={pageSize}
                className='panel main-panel playlist-content'
                onLoadPage={this.handleLoadPage}
                onDoubleClick={this.handleDoubleClick} />
        );
    }
}

PlaylistContent.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired
};
