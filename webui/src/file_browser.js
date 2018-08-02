import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlaylistModel from './playlist_model'
import FileBrowserModel from './file_browser_model'
import urls from './urls'
import { getDisplaySize, getDisplayDate, mapRange } from './utils'
import DataTable from './data_table'
import NotificationModel from './notification_model';

const iconNames = Object.freeze({
    D: 'folder',
    F: 'file',
});

const columnNames = ['Name', 'Size', 'Date'];
const columnSizes = [5, 1, 2];
const pageSize = 100;

function getRowData(item)
{
    return {
        icon: iconNames[item.type],
        url: item.type == 'D' ? urls.browsePath(item.path) : null,
        columns: [
            item.name,
            getDisplaySize(item.size),
            getDisplayDate(item.timestamp),
        ]
    };
}

export default class FileBrowser extends Component
{
    constructor(props)
    {
        super(props);

        this.updateOn({ fileBrowserModel: 'change' });

        this.state = this.getStateFromModel(0);

        this.handleClick = this.handleClick.bind(this);
        this.handleLoadPage = this.handleLoadPage.bind(this);
    }

    getStateFromModel(offset)
    {
        if (offset === undefined)
            offset = this.state.offset;

        const { entries } = this.props.fileBrowserModel;

        const count = offset + pageSize > entries.length
            ? entries.length - offset
            : pageSize;

        const data = mapRange(offset, count, i => getRowData(entries[i]));

        return { offset, data, totalCount: entries.length };
    }

    handleLoadPage(offset)
    {
        setTimeout(() => this.setState(this.getStateFromModel(offset)), 0);
    }

    handleClick(index)
    {
        const { playlistModel, fileBrowserModel, notificationModel } = this.props;
        const itemPath = fileBrowserModel.entries[index].path;
        playlistModel.addItems([itemPath]);
        notificationModel.notifyAddItem(itemPath);
    }

    render()
    {
        return (
            <DataTable
                columnNames={columnNames}
                columnSizes={columnSizes}
                data={this.state.data}
                offset={this.state.offset}
                pageSize={pageSize}
                totalCount={this.state.totalCount}
                onClick={this.handleClick}
                onLoadPage={this.handleLoadPage}
                useIcons={true}
                className='panel main-panel file-browser' />
        )
    }
}

FileBrowser.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    fileBrowserModel: PropTypes.instanceOf(FileBrowserModel).isRequired,
    notificationModel: PropTypes.instanceOf(NotificationModel).isRequired,
};
