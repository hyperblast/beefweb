import React from 'react'
import { rootPath } from './file_browser_model.js'
import { Button, Menu, MenuItem } from './elements.js'
import urls from './urls.js'
import ModelBinding from './model_binding.js'
import { DropdownButton } from './dropdown.js'
import { bindHandlers } from './utils.js'
import { AddAction } from './settings_model.js'
import ServiceContext from "./service_context.js";

class FileBrowserHeader extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        bindHandlers(this);

        this.state = Object.assign({ menuOpen: false }, this.getStateFromModel());
    }

    getStateFromModel()
    {
        const { permissions } = this.context.playerModel;
        const { currentPath, parentPath, pathStack } = this.context.fileBrowserModel;
        return { currentPath, parentPath, pathStack, allowChangePlaylists: permissions.changePlaylists };
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

    handleRequestMenuOpen(value)
    {
        this.setState({ menuOpen: value });
    }

    renderBreadcrumbs()
    {
       return this.state.pathStack.map((item, index) => (
            <li key={index} className='header-tab header-tab-active'>
                <a href={urls.browsePath(item.path)} title={item.path}>
                    {item.title}
                </a>
            </li>
       ));
    }

    renderButtons()
    {
        const { parentPath, menuOpen, allowChangePlaylists } = this.state;

        if (!parentPath)
            return null;

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    {
                        allowChangePlaylists
                            ? <Button name='data-transfer-download'
                                      onClick={this.handleAddClick}
                                      title='Add current directory' />
                            : null
                    }
                    <Button
                        name='arrow-thick-top'
                        href={urls.browsePath(parentPath)}
                        title='Navigate to parent directory' />
                    {
                        allowChangePlaylists
                            ? <DropdownButton
                                    iconName='menu'
                                    title='Directory menu'
                                    direction='left'
                                    isOpen={menuOpen}
                                    onRequestOpen={this.handleRequestMenuOpen}>
                                    <Menu>
                                        <MenuItem title='Add' onClick={this.handleAddClick} />
                                        <MenuItem title='Add & Play' onClick={this.handleAddAndPlayClick} />
                                        <MenuItem title='Replace & Play' onClick={this.handleReplaceAndPlayClick} />
                                    </Menu>
                            </DropdownButton>
                            : null
                    }
                </div>
            </div>
        );
    }

    render()
    {
        return (
            <div className='panel panel-header'>
                <ul className='header-block header-block-primary'>
                    { this.renderBreadcrumbs() }
                </ul>
                { this.renderButtons() }
            </div>
        );
    }
}

export default ModelBinding(FileBrowserHeader, {
    fileBrowserModel: 'change',
    playerModel: 'change'
});
