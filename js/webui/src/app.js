import React from 'react'
import PropTypes from 'prop-types'
import AppModel from './app_model'
import { PanelHeader } from './elements'
import ControlBar from './control_bar'
import PlaylistSwitcher from './playlist_switcher'
import PlaylistMenu from './playlist_menu'
import PlaylistContent from './playlist_content'
import FileBrowser from './file_browser'
import FileBrowserHeader from './file_browser_header'
import Settings from './settings'
import StatusBar from './status_bar'
import ModelBinding from './model_binding';
import NavigationModel, { View } from './navigation_model';

class App extends React.PureComponent
{
    constructor(props)
    {
        super(props);

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
        const { view } = this.props.navigationModel;
        return { view };
    }

    renderPlaylistView()
    {
        const {
            playerModel,
            playlistModel,
            settingsModel,
            scrollManager,
        } = this.props.appModel;

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
        } = this.props.appModel;

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
        const { settingsModel } = this.props.appModel;

        return {
            header: <PanelHeader title='Settings' />,
            main: <Settings settingsModel={settingsModel} />
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
        } = this.props.appModel;

        const view = this.renderView[this.state.view].call(this);

        return (
            <div className='app'>
                <ControlBar
                    playerModel={playerModel}
                    settingsModel={settingsModel}
                    navigationModel={navigationModel} />
                { view.header }
                { view.main }
                <StatusBar
                    playerModel={playerModel}
                    playlistModel={playlistModel} />
            </div>
        );
    }
}

App.propTypes = {
    appModel: PropTypes.instanceOf(AppModel).isRequired,
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired,
};

export default ModelBinding(App, { navigationModel: 'viewChange' });
