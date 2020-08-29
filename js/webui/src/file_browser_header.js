import React from 'react'
import PropTypes from 'prop-types'
import FileBrowserModel, { rootPath } from './file_browser_model'
import PlaylistModel from './playlist_model'
import { Button, Menu, MenuItem, MenuSeparator } from './elements'
import urls from './urls'
import NotificationModel from './notification_model';
import ModelBinding from './model_binding';
import { DropdownButton } from './dropdown';
import { bindHandlers } from './utils';

class FileBrowserHeader extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        bindHandlers(this);

        this.state = Object.assign({ menuOpen: false }, this.getStateFromModel());
    }

    getStateFromModel()
    {
        const { currentPath, parentPath, pathStack } = this.props.fileBrowserModel;
        return { currentPath, parentPath, pathStack };
    }

    addCurrent(options)
    {
        const { playlistModel, fileBrowserModel, notificationModel } = this.props;
        const { currentPath } = fileBrowserModel;

        if (currentPath === rootPath)
            return;

        playlistModel.addItems([currentPath], options);
        notificationModel.notifyAddDirectory(currentPath);
    }

    handleAddClick()
    {
        this.addCurrent();
    }

    handleAddAndPlayClick()
    {
        this.addCurrent({ play: true });
    }

    handleReplaceAndPlayClick()
    {
        this.addCurrent({ play: true, replace: true });
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
        const { parentPath, menuOpen } = this.state;

        if (!parentPath)
            return null;

        return (
            <div className='header-block'>
                <div className='button-bar'>
                    <Button
                        name='data-transfer-download'
                        onClick={this.handleAddClick}
                        title='Add current directory' />
                    <Button
                        name='arrow-thick-top'
                        href={urls.browsePath(parentPath)}
                        title='Navigate to parent directory' />
                    <DropdownButton
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
                </div>
            </div>
        );
    }

    render()
    {
        return (
            <div className='panel-header'>
                <ul className='header-block header-block-primary'>
                    { this.renderBreadcrumbs() }
                </ul>
                { this.renderButtons() }
            </div>
        );
    }
}

FileBrowserHeader.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    fileBrowserModel: PropTypes.instanceOf(FileBrowserModel).isRequired,
    notificationModel: PropTypes.instanceOf(NotificationModel).isRequired,
};

export default ModelBinding(FileBrowserHeader, { fileBrowserModel: 'change' });
