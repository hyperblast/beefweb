import React from 'react'
import urls from './urls.js'
import { getDisplaySize, getDisplayDate, mapRange, bindHandlers } from './utils.js'
import DataTable from './data_table.js'
import ModelBinding from './model_binding.js';
import { Menu, MenuItem } from './elements.js';
import { AddAction } from './settings_model.js';
import ServiceContext from "./service_context.js";

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
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        bindHandlers(this);

        this.state = this.getStateFromModel(0);
    }

    getStateFromModel(offset)
    {
        if (offset === undefined)
            offset = this.state.offset;

        const { entries } = this.context.fileBrowserModel;

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
        this.addItem(index, null);
    }

    handleMenuAdd(index)
    {
        this.addItem(index, AddAction.add);
    }

    handleMenuAddAndPlay(index)
    {
        this.addItem(index, AddAction.addAndPlay);
    }

    handleMenuReplaceAndPlay(index)
    {
        this.addItem(index, AddAction.replaceAndPlay);
    }

    addItem(index, action)
    {
        const { playlistModel, fileBrowserModel, notificationModel } = this.context;
        const itemPath = fileBrowserModel.entries[index].path;
        playlistModel.addItems([itemPath], action);
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
                scrollManager={this.context.scrollManager}
                onClick={this.handleClick}
                onLoadPage={this.handleLoadPage}
                useIcons={true}
                rowMenuTitle='Add...'
                onRenderRowMenu={this.handleRenderRowMenu}
                className='panel panel-main file-browser' />
        )
    }
}

export default ModelBinding(FileBrowser, { fileBrowserModel: 'change' });
