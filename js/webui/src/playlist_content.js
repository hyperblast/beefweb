import React from 'react'
import { PlaybackState } from 'beefweb-client'
import DataTable from './data_table.js'
import { bindHandlers } from './utils.js'
import ModelBinding from './model_binding.js';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './elements.js';
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
        const { queueMap } = this.context.playQueueModel;
        const { columns, playlistItems, currentPlaylistId } = this.context.playlistModel;
        const { offset, totalCount, items } = playlistItems;

        return {
            playbackState,
            columns,
            offset,
            totalCount,
            items,
            currentPlaylistId,
            queueMap,
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
        const { playbackState, offset, items, queueMap, currentPlaylistId, activeItemIndex } = this.state;

        return items.map((item, index) =>
        {
            const itemIndex = index + offset;
            const icon = itemIndex === activeItemIndex
                ? playbackStateIcons[playbackState]
                : null;

            const iconText = icon
                ? null
                : this.getQueueIndex(queueMap, currentPlaylistId, itemIndex);

            return { icon, iconText, columns: item.columns };
        });
    }

    getQueueIndex(queueMap, playlistId, itemIndex)
    {
        const indices = queueMap.getQueueIndices(playlistId, itemIndex);

        if (!indices)
        {
            return null;
        }

        if (indices.length === 1)
        {
            return `(${indices[0]})`;
        }

        return '(' + indices.join(', ') + ')';
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

    handleRenderRowMenu(index)
    {
        const playlistId = this.state.currentPlaylistId;
        const inQueue = this.state.queueMap.getQueueIndices(playlistId, index) !== null;

        const play = () => this.context.playlistModel.activateItem(index);
        const appendToQueue = () => this.context.playQueueModel.appendToQueue(playlistId, index);
        const remove = () => this.context.playlistModel.removeItem(index);

        let removeFromQueueItem = null;
        if (inQueue)
        {
            const removeFromQueue = () => this.context.playQueueModel.removeFromQueue(playlistId, index);
            removeFromQueueItem = <MenuItem title="Remove from queue" onClick={removeFromQueue}/>;
        }

        let prependToQueueItem;
        let appendToQueueItem;

        if (this.context.playerModel.features.prependToQueue)
        {
            const prependToQueue = () => this.context.playQueueModel.prependToQueue(playlistId, index);
            prependToQueueItem = <MenuItem title="Add to queue (start)" onClick={prependToQueue}/>;
            appendToQueueItem = <MenuItem title="Add to queue (end)" onClick={appendToQueue} />;
        }
        else
        {
            prependToQueueItem = null;
            appendToQueueItem = <MenuItem title="Add to queue" onClick={appendToQueue} />;
        }

        return (
            <Menu>
                <MenuItem title='Play' onClick={play} />
                { prependToQueueItem }
                { appendToQueueItem }
                { removeFromQueueItem }
                <MenuSeparator />
                <MenuItem title='Remove' onClick={remove} />
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
                className='panel panel-main playlist-content'
                onLoadPage={this.handleLoadPage}
                onDoubleClick={this.handleDoubleClick}
                onRenderColumnMenu={this.handleRenderColumnMenu}
                onRenderRowMenu={this.handleRenderRowMenu} />
        );
    }
}

export default ModelBinding(PlaylistContent, {
    playerModel: 'change',
    playlistModel: ['playlistsChange', 'itemsChange'],
    playQueueModel: 'change',
});
