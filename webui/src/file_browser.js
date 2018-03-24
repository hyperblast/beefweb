import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlaylistModel from './playlist_model'
import FileBrowserModel from './file_browser_model'
import urls from './urls'
import { getDisplaySize, getDisplayDate } from './utils'
import Table from './table'

const fileTypes = Object.freeze({
    F: 'File',
    D: 'Directory'
});

const columnNames = ['Name', 'Type', 'Size', 'Date'];

function getRowData(item)
{
    return {
        url: item.type == 'D' ? urls.browsePath(item.path) : null,
        columns: [
            item.name,
            fileTypes[item.type],
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
        this.state = this.getStateFromModel();
        this.handleClick = this.handleClick.bind(this);
    }

    getStateFromModel()
    {
        const { entries } = this.props.fileBrowserModel;

        return { rows: entries.map(getRowData) };
    }

    handleClick(idx)
    {
        var itemPath = this.props.fileBrowserModel.entries[idx].path;
        this.props.playlistModel.addItems([itemPath]);
    }

    render()
    {
        return (
            <div className='panel main-panel table-content file-browser'>
                <Table columns={columnNames} rows={this.state.rows} onClick={this.handleClick} />
            </div>
        )
    }
}

FileBrowser.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    fileBrowserModel: PropTypes.instanceOf(FileBrowserModel).isRequired
};
