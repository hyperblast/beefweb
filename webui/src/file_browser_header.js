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
        const { currentPath, parentPath, pathStack, pathSeparator } = this.props.fileBrowserModel;
        return { currentPath, parentPath, pathStack, pathSeparator };
    }

    getParentLink()
    {
        const parentPath = this.state.parentPath;

        if (parentPath)
        {
            return { url:  urls.browsePath(parentPath), onClick: null };
        }
        else
        {
            return { url: null, onClick: e => e.preventDefault() };
        }
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

    renderBreadcrumb()
    {
        const items = [];
        let i = 0;

        for (let item of this.state.pathStack)
        {
            items.push(
                <a key={i} href={urls.browsePath(item.path)} title={item.path}>
                    {item.title}
                </a>
            );

            items.push(
                <span key={i + 1}>
                    { this.state.pathSeparator }
                </span>
            );

            i += 2;
        }

        items.pop();

        return items;
    }

    render()
    {
        const parentLink = this.getParentLink();
        const title = this.state.currentPath === rootPath
            ? 'Music directories'
            : this.state.currentPath;

        return (
            <div className='panel-header'>
                <div className='header-block header-block-primary'>
                    <div className='header-label header-label-primary'>
                        { this.renderBreadcrumb() }
                    </div>
                </div>
                <div className='header-block'>
                    <div className='button-bar'>
                        <Button
                            name='data-transfer-download'
                            onClick={this.handleAddClick}
                            title='Add current directory' />
                        <Button
                            name='home'
                            href={urls.browsePath(rootPath)}
                            title='Navigate to list of music directories' />
                        <Button
                            name='arrow-thick-top'
                            href={parentLink.url}
                            onClick={parentLink.onClick}
                            title='Navigate to parent directory' />
                    </div>
                </div>
            </div>
        );
    }
}

FileBrowserHeader.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    fileBrowserModel: PropTypes.instanceOf(FileBrowserModel).isRequired,
    notificationModel: PropTypes.instanceOf(NotificationModel).isRequired,
};

