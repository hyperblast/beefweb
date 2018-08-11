import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import FileBrowserModel, { rootPath } from './file_browser_model'
import PlaylistModel from './playlist_model'
import { Button } from './elements'
import urls from './urls'
import NotificationModel from './notification_model';

export default class FileBrowserHeader extends Component
{
    constructor(props)
    {
        super(props);

        this.updateOn({ fileBrowserModel: 'change' });
        this.state = this.getStateFromModel();
        this.handleAddClick = this.handleAddClick.bind(this);
    }

    getStateFromModel()
    {
        const { currentPath, parentPath, pathStack } = this.props.fileBrowserModel;
        return { currentPath, parentPath, pathStack };
    }

    handleAddClick(e)
    {
        e.preventDefault();

        const { playlistModel, fileBrowserModel, notificationModel } = this.props;
        const { currentPath } = fileBrowserModel;

        if (currentPath === rootPath)
            return;

        playlistModel.addItems([currentPath]);
        notificationModel.notifyAddDirectory(currentPath);
    }

    renderBreadcrumbs()
    {
       return this.state.pathStack.map((item, index) => (
            <li className='header-tab header-tab-active'>
                <a key={index} href={urls.browsePath(item.path)} title={item.path}>
                    {item.title}
                </a>
            </li>
       ));
    }

    renderButtons()
    {
        const { parentPath } = this.state;

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

