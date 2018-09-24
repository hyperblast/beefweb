import React from 'react'
import PropTypes from 'prop-types'
import { PlaybackState } from 'beefweb-client'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import DataTable from './data_table'
import { bindHandlers } from './utils'
import ScrollManager from './scroll_manager';
import ModelBinding from './model_binding';
import { Menu, MenuItem, MenuLabel } from './elements';

const pageSize = 100;

const playbackStateIcons = {
    [PlaybackState.playing]: 'media-play',
    [PlaybackState.paused]: 'media-pause',
    [PlaybackState.stopped]: 'none',
};

export function playlistTableKey(id)
{
    return `Playlists.${id}`;
}

class PlaylistContent extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackState } = this.props.playerModel;
        const { columns, playlistItems, currentPlaylistId } = this.props.playlistModel;
        const { offset, totalCount, items } = playlistItems;

        return {
            playbackState,
            columns,
            offset,
            totalCount,
            items,
            currentPlaylistId,
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

    handleRenderColumnDropdown(index)
    {
        const { title, expression } = this.props.playlistModel.columns[index];

        const sortAsc = e => {
            e.preventDefault();
            this.props.playlistModel.sortPlaylist(expression, false);
        };

        const sortDesc = e => {
            e.preventDefault();
            this.props.playlistModel.sortPlaylist(expression, true);
        };

        return (
            <Menu>
                <MenuLabel title={'Sort by ' + title} />
                <MenuItem title={'Ascending'} onClick={sortAsc} />
                <MenuItem title={'Descending'} onClick={sortDesc} />
            </Menu>
        );
    }

    render()
    {
        const { columns } = this.state;
        const columnNames = columns.map(c => c.title);
        const columnSizes = columns.map(c => c.size);

        return (
            <DataTable
                useIcons={true}
                columnNames={columnNames}
                columnSizes={columnSizes}
                data={this.getTableData()}
                offset={this.state.offset}
                totalCount={this.state.totalCount}
                pageSize={pageSize}
                globalKey={playlistTableKey(this.state.currentPlaylistId)}
                scrollManager={this.props.scrollManager}
                className='panel main-panel playlist-content'
                onLoadPage={this.handleLoadPage}
                onDoubleClick={this.handleDoubleClick}
                onRenderColumnDropdown={this.handleRenderColumnDropdown} />
        );
    }
}

PlaylistContent.propTypes = {
    playerModel: PropTypes.instanceOf(PlayerModel).isRequired,
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    scrollManager: PropTypes.instanceOf(ScrollManager).isRequired,
};

export default ModelBinding(PlaylistContent, {
    playerModel: 'change',
    playlistModel: ['playlistsChange', 'itemsChange']
});
