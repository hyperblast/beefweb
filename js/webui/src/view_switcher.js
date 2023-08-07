import React from 'react'
import { Button, Menu, MenuItem } from './elements.js'
import urls from './urls.js'
import ModelBinding from './model_binding.js';
import { View } from './navigation_model.js';
import ServiceContext from "./service_context.js";
import { MediaSize } from "./settings_model.js";
import { DropdownButton } from "./dropdown.js";
import { bindHandlers } from "./utils.js";

class ViewSwitcher extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        bindHandlers(this);

        this.state = this.getStateFromModel();
        this.state.menuOpen = false;
    }

    getStateFromModel()
    {
        const { navigationModel, settingsModel } = this.context;

        return {
            view: navigationModel.view,
            displayInline: settingsModel.mediaSizeUp(MediaSize.medium),
        };
    }

    handleMenuRequestOpen(value)
    {
        this.setState({ menuOpen: value });
    }

    render()
    {
        const { menuOpen, view, displayInline } = this.state;

        if (displayInline)
        {
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

        return (
            <div className='view-switcher button-bar'>
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
            </div>
        );
    }
}

ViewSwitcher.propTypes = {};
ViewSwitcher.contextType = ServiceContext;

export default ModelBinding(ViewSwitcher, {
    navigationModel: 'viewChange',
    settingsModel: 'mediaSizeChange'
});
