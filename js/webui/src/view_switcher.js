import React from 'react'
import { IconButton, Menu, MenuItem } from './elements.js'
import urls from './urls.js'
import ModelBinding from './model_binding.js';
import { View } from './navigation_model.js';
import ServiceContext from "./service_context.js";
import { DropdownButton } from "./dropdown.js";
import { bindHandlers } from "./utils.js";

class ViewSwitcher_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { view } = this.context.navigationModel;
        return { view };
    }

    render()
    {
        const { view } = this.state;

        return (
            <div className='view-switcher button-bar'>
                <IconButton
                    name='list'
                    className='control-bar-button'
                    href={urls.viewCurrentPlaylist}
                    active={view === View.playlist}
                    title='Playlists'/>
                <IconButton
                    name='image'
                    className='control-bar-button'
                    href={urls.viewAlbumArt}
                    active={view === View.albumArt}
                    title='Album art' />
                <IconButton
                    name='folder'
                    className='control-bar-button'
                    href={urls.browseCurrentPath}
                    active={view === View.fileBrowser}
                    title='Files'/>
                <IconButton
                    name='cog'
                    className='control-bar-button'
                    href={urls.viewCurrentSettings}
                    active={view === View.settings}
                    title='Settings'/>
            </div>
        );
    }
}

export const ViewSwitcher = ModelBinding(ViewSwitcher_, { navigationModel: 'viewChange' });

class ViewSwitcherButton_ extends React.PureComponent
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
        const { view } = this.context.navigationModel;
        return { view };
    }

    render()
    {
        const { view } = this.state;

        return (
            <DropdownButton
                title='Switch view'
                iconName='grid-three-up'
                className='control-bar-button'
                hideOnContentClick={true}>
                <Menu>
                    <MenuItem
                        href={urls.viewCurrentPlaylist}
                        checked={view === View.playlist}
                        title='Playlists'/>
                    <MenuItem
                        href={urls.viewAlbumArt}
                        checked={view === View.albumArt}
                        title='Album art'/>
                    <MenuItem
                        href={urls.browseCurrentPath}
                        checked={view === View.fileBrowser}
                        title='Files'/>
                    <MenuItem
                        href={urls.viewCurrentSettings}
                        checked={view === View.settings}
                        title='Settings'/>
                </Menu>
            </DropdownButton>
        );
    }
}

export const ViewSwitcherButton = ModelBinding(ViewSwitcherButton_, {
    navigationModel: 'viewChange'
});
