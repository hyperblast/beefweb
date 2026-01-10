import React, { useCallback } from 'react';
import { rootPath } from './file_browser_model.js'
import { IconButton, Menu, MenuItem, Select } from './elements.js';
import urls from './urls.js'
import ModelBinding from './model_binding.js'
import { DropdownButton } from './dropdown.js'
import { bindHandlers } from './utils.js'
import { AddAction, MediaSize } from './settings_model.js';
import ServiceContext from "./service_context.js";
import { makeClassName } from './dom_utils.js';
import { defineModelData, useFileBrowserModel, useOverflowDetection } from './hooks.js';

const usePathStack = defineModelData({
    selector: context => context.fileBrowserModel.pathStack,
    updateOn: {
        fileBrowserModel: 'change'
    }
});

function BrowserPathSelector()
{
    const model = useFileBrowserModel();
    const handleSelectPath = useCallback(e => model.browse(e.target.value), []);
    const items = usePathStack();
    const selectedPath = items.length > 0 ? items[items.length - 1].path : null;

    return <div className='header-block header-block-primary'>
        <Select className='header-selector'
                items={items}
                selectedItemId={selectedPath}
                idProperty='path'
                nameProperty='shortName'
                onChange={handleSelectPath}/>
    </div>
}

function BrowserPathBreadcrumbs()
{
    const items = usePathStack();
    const [overflow, containerRef] = useOverflowDetection([items])

    const elements = items.map((item, index) => (
        <li key={index} className='header-tab header-tab-selected'>
            <a href={urls.browsePath(item.path)} title={item.longName}>
                {item.shortName}
            </a>
        </li>
    ));

    const className = makeClassName([
        'header-block',
        'header-block-primary',
        overflow ? 'header-block-overflow' : null,
    ])

    return <ul className={className} ref={containerRef}>
        { elements }
    </ul>
}

class FileBrowserHeader extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        bindHandlers(this);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { permissions } = this.context.playerModel;
        const { currentPath, parentPath, pathStack } = this.context.fileBrowserModel;
        const { mediaSize } = this.context.settingsModel;

        return {
            currentPath,
            parentPath,
            pathStack,
            mediaSize,
            allowChangePlaylists: permissions.changePlaylists
        };
    }

    addCurrent(action)
    {
        const { playlistModel, fileBrowserModel, notificationModel } = this.context;
        const { currentPath } = fileBrowserModel;

        if (currentPath === rootPath)
            return;

        playlistModel.addItems([currentPath], action);
        notificationModel.notifyAddDirectory(currentPath);
    }

    handleAddClick()
    {
        this.addCurrent(AddAction.add);
    }

    handleAddAndPlayClick()
    {
        this.addCurrent(AddAction.addAndPlay);
    }

    handleReplaceAndPlayClick()
    {
        this.addCurrent(AddAction.replaceAndPlay);
    }

    renderButtons()
    {
        const { parentPath, allowChangePlaylists } = this.state;

        if (!parentPath)
            return null;

        const addCurrentDirectoryButton =
            allowChangePlaylists
            ? <IconButton name='data-transfer-download'
                      onClick={this.handleAddClick}
                      title='Add current directory'/>
            : null;

        const directoryMenu =
            allowChangePlaylists
            ? <DropdownButton
                iconName='menu'
                title='Directory menu'>
                <Menu>
                    <MenuItem title='Add' onClick={this.handleAddClick}/>
                    <MenuItem title='Add & Play' onClick={this.handleAddAndPlayClick}/>
                    <MenuItem title='Replace & Play' onClick={this.handleReplaceAndPlayClick}/>
                </Menu>
            </DropdownButton>
            : null;

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    { addCurrentDirectoryButton }
                    <IconButton
                        name='arrow-thick-top'
                        href={urls.browsePath(parentPath)}
                        title='Navigate to parent directory'/>
                    { directoryMenu }
                </div>
            </div>
        );
    }

    render()
    {
        const { mediaSize } = this.state;

        return (
            <div className='panel panel-header'>
                { mediaSize === MediaSize.small ? <BrowserPathSelector/> : <BrowserPathBreadcrumbs/> }
                { this.renderButtons() }
            </div>
        );
    }
}

export default ModelBinding(FileBrowserHeader, {
    fileBrowserModel: 'change',
    playerModel: 'change',
    settingsModel: 'mediaSize'
});
