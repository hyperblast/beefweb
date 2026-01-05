import React from 'react'
import { PanelHeader } from './elements.js'
import { ControlBar } from './control_bar.js'
import PlaylistSwitcher from './playlist_switcher.js'
import PlaylistMenu from './playlist_menu.js'
import PlaylistContent from './playlist_content.js'
import FileBrowser from './file_browser.js'
import FileBrowserHeader from './file_browser_header.js'
import StatusBar from './status_bar.js'
import ModelBinding from './model_binding.js';
import { View } from './navigation_model.js';
import SettingsHeader from './settings_header.js';
import SettingsContent from './settings_content.js';
import ServiceContext from './service_context.js';
import PlaybackInfoBar from './playback_info_bar.js';
import AlbumArtViewer from "./album_art_viewer.js";

class App extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();

        this.renderView = {
            [View.playlist]: this.renderPlaylistView,
            [View.fileBrowser]: this.renderFileBrowserView,
            [View.albumArt]: this.renderAlbumArt,
            [View.settings]: this.renderSettingsView,
            [View.notFound]: this.renderNotFoundView,
        };
    }

    getStateFromModel()
    {
        const { navigationModel, settingsModel } = this.context;
        const { view } = navigationModel;
        const { showPlaybackInfo, showStatusBar } = settingsModel;
        return { view, showPlaybackInfo, showStatusBar };
    }

    componentDidMount()
    {
        this.context.viewSwitcherController.update();
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        this.context.viewSwitcherController.update();
    }

    componentWillUnmount()
    {
        this.context.viewSwitcherController.update();
    }

    renderPlaylistView()
    {
        return {
            header: (
                <div className='panel panel-header'>
                    <PlaylistSwitcher />
                    <PlaylistMenu />
                </div>
            ),
            main: (
                <PlaylistContent />
            )
        };
    }

    renderFileBrowserView()
    {
        return {
            header: (
                <FileBrowserHeader />
            ),
            main: (
                <FileBrowser />
            )
        };
    }

    renderAlbumArt()
    {
        return {
            header: null,
            main: <AlbumArtViewer/>
        };
    }

    renderSettingsView()
    {
        return {
            header: <SettingsHeader />,
            main: <SettingsContent/>
        };
    }

    renderNotFoundView()
    {
        return {
            header: <PanelHeader title='Invalid url' />,
            main: <div className='panel panel-main'>Invalid url</div>
        };
    }

    render()
    {
        const { view, showPlaybackInfo, showStatusBar } = this.state;
        const { header, main } = this.renderView[view].call(this);

        const playbackInfoBar = showPlaybackInfo ? <PlaybackInfoBar /> : null;
        const statusBar = showStatusBar ? <StatusBar /> : null;

        return (
            <div className='app'>
                { playbackInfoBar }
                <ControlBar />
                { header }
                { main }
                { statusBar }
            </div>
        );
    }
}

export default ModelBinding(App, {
    navigationModel: 'viewChange',
    settingsModel: ['showPlaybackInfo', 'showStatusBar']
});
