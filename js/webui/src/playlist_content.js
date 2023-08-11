import React from 'react'
import { PlaybackState } from 'beefweb-client'
import DataTable from './data_table.js'
import { bindHandlers } from './utils.js'
import ModelBinding from './model_binding.js';
import { Menu, MenuItem, MenuLabel } from './elements.js';
import ServiceContext from "./service_context.js";

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
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();

        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { playbackState } = this.context.playerModel;
        const { columns, playlistItems, currentPlaylistId } = this.context.playlistModel;
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
        const { playerModel, playlistModel } = this.context;
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
        this.context.playlistModel.activateItem(index);
    }

    handleLoadPage(offset)
    {
        this.context.playlistModel.setItemsPage(offset, pageSize);
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

    handleRenderColumnMenu(index)
    {
        const { title, expression } = this.context.playlistModel.columns[index];

        const sortAsc = () => this.context.playlistModel.sortPlaylist(expression, false);
        const sortDesc = () => this.context.playlistModel.sortPlaylist(expression, true);

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
                scrollManager={this.context.scrollManager}
                className='panel main-panel playlist-content'
                onLoadPage={this.handleLoadPage}
                onDoubleClick={this.handleDoubleClick}
                onRenderColumnMenu={this.handleRenderColumnMenu} />
        );
    }
}

export default ModelBinding(PlaylistContent, {
    playerModel: 'change',
    playlistModel: ['playlistsChange', 'itemsChange']
});
