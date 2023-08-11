import React from 'react'
import { Button, Menu, MenuItem } from './elements.js'
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
        return {
            view: this.context.navigationModel.view,
        };
    }

    render()
    {
        const { view } = this.state;

        return (
            <div className='view-switcher button-bar'>
                <Button
                    name='list'
                    href={urls.viewCurrentPlaylist}
                    active={view === View.playlist}
                    title='Playlist'/>
                <Button
                    name='folder'
                    href={urls.browseCurrentPath}
                    active={view === View.fileBrowser}
                    title='Files'/>
                <Button
                    name='cog'
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
        this.state.menuOpen = false;
    }

    handleMenuRequestOpen(value)
    {
        this.setState({menuOpen: value});
    }

    getStateFromModel()
    {
        return {
            view: this.context.navigationModel.view,
        };
    }

    render()
    {
        const { view, menuOpen } = this.state;

        return (
            <DropdownButton
                title='Switch view'
                iconName='list'
                hideOnContentClick={true}
                direction='left'
                isOpen={menuOpen}
                onRequestOpen={this.handleMenuRequestOpen}>
                <Menu>
                    <MenuItem
                        href={urls.viewCurrentPlaylist}
                        checked={view === View.playlist}
                        title='Playlist'/>
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

export const ViewSwitcherButton = ModelBinding(ViewSwitcherButton_, { navigationModel: 'viewChange' });
