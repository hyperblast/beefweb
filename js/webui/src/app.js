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

class App extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();

        this.renderView = {
            [View.playlist]: this.renderPlaylistView,
            [View.fileBrowser]: this.renderFileBrowserView,
            [View.settings]: this.renderSettingsView,
            [View.notFound]: this.renderNotFoundView,
        };
    }

    getStateFromModel()
    {
        const { navigationModel, settingsModel } = this.context;
        const { view } = navigationModel;
        const { showPlaybackInfo } = settingsModel;
        return { view, showPlaybackInfo };
    }

    renderPlaylistView()
    {
        const {
            playerModel,
            playlistModel,
            settingsModel,
            scrollManager,
        } = this.context;

        return {
            header: (
                <div className='panel-header'>
                    <PlaylistSwitcher
                        playerModel={playerModel}
                        playlistModel={playlistModel}
                        settingsModel={settingsModel} />
                    <PlaylistMenu
                        playlistModel={playlistModel}
                        settingsModel={settingsModel} />
                </div>
            ),
            main: (
                <PlaylistContent
                    playerModel={playerModel}
                    playlistModel={playlistModel}
                    scrollManager={scrollManager} />
            )
        };
    }

    renderFileBrowserView()
    {
        const {
            playlistModel,
            fileBrowserModel,
            notificationModel,
            scrollManager,
        } = this.context;

        return {
            header: (
                <FileBrowserHeader
                    fileBrowserModel={fileBrowserModel}
                    playlistModel={playlistModel}
                    notificationModel={notificationModel} />
            ),
            main: (
                <FileBrowser
                    fileBrowserModel={fileBrowserModel}
                    playlistModel={playlistModel}
                    notificationModel={notificationModel}
                    scrollManager={scrollManager} />
            )
        };
    }

    renderSettingsView()
    {
        return {
            header: <SettingsHeader />,
            main: <SettingsContent />
        };
    }

    renderNotFoundView()
    {
        return {
            header: <PanelHeader title='Invalid url' />,
            main: <div className='panel main-panel'>Invalid url</div>
        };
    }

    render()
    {
        const {
            playerModel,
            playlistModel,
            settingsModel,
            navigationModel
        } = this.context;

        const view = this.renderView[this.state.view].call(this);

        const playbackInfoBar = this.state.showPlaybackInfo
            ? <PlaybackInfoBar />
            : null;

        return (
            <div className='app'>
                { playbackInfoBar }
                <ControlBar
                    playerModel={playerModel}
                    settingsModel={settingsModel}
                    navigationModel={navigationModel} />
                { view.header }
                { view.main }
                <StatusBar />
            </div>
        );
    }
}

App.contextType = ServiceContext;

export default ModelBinding(App, {
    navigationModel: 'viewChange',
    settingsModel: 'change'
});
