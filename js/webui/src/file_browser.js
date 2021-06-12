import React from 'react'
import PropTypes from 'prop-types'
import PlaylistModel from './playlist_model'
import FileBrowserModel from './file_browser_model'
import urls from './urls'
import { getDisplaySize, getDisplayDate, mapRange, bindHandlers } from './utils'
import DataTable from './data_table'
import NotificationModel from './notification_model';
import ScrollManager from './scroll_manager';
import ModelBinding from './model_binding';
import { Menu, MenuItem } from './elements';

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
        url: item.type === 'D' ? urls.browsePath(item.path) : null,
        columns: [
            item.name,
            getDisplaySize(item.size),
            getDisplayDate(item.timestamp),
        ]
    };
}

class FileBrowser extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        bindHandlers(this);

        this.state = this.getStateFromModel(0);
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
        this.addItem(index, {});
    }

    handleMenuAdd(index)
    {
        this.addItem(index, {});
    }

    handleMenuAddAndPlay(index)
    {
        this.addItem(index, { play: true });
    }

    handleMenuReplaceAndPlay(index)
    {
        this.addItem(index, { play: true, replace: true });
    }

    addItem(index, options)
    {
        const { playlistModel, fileBrowserModel, notificationModel } = this.props;
        const itemPath = fileBrowserModel.entries[index].path;
        playlistModel.addItems([itemPath], options);
        notificationModel.notifyAddItem(itemPath);
    }

    handleRenderRowMenu(index)
    {
        const add = () => this.handleMenuAdd(index);
        const addAndPlay = () => this.handleMenuAddAndPlay(index);
        const replaceAndPlay = () => this.handleMenuReplaceAndPlay(index);

        return (
            <Menu>
                <MenuItem title='Add' onClick={add} />
                <MenuItem title='Add & Play' onClick={addAndPlay} />
                <MenuItem title='Replace & Play' onClick={replaceAndPlay} />
            </Menu>
        );
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
                globalKey='FileBrowser'
                scrollManager={this.props.scrollManager}
                onClick={this.handleClick}
                onLoadPage={this.handleLoadPage}
                useIcons={true}
                rowMenuTitle='Add...'
                rowMenuIconName='data-transfer-download'
                onRenderRowMenu={this.handleRenderRowMenu}
                className='panel main-panel file-browser' />
        )
    }
}

FileBrowser.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    fileBrowserModel: PropTypes.instanceOf(FileBrowserModel).isRequired,
    notificationModel: PropTypes.instanceOf(NotificationModel).isRequired,
    scrollManager: PropTypes.instanceOf(ScrollManager).isRequired,
};

export default ModelBinding(FileBrowser, { fileBrowserModel: 'change' });
