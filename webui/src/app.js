import React from 'react'
import PropTypes from 'prop-types'
import AppModel, { ViewId } from './app_model'
import { PanelHeader } from './elements'
import ControlBar from './control_bar'
import PlaylistSwitcher from './playlist_switcher'
import PlaylistMenu from './playlist_menu'
import PlaylistContent from './playlist_content'
import FileBrowser from './file_browser'
import FileBrowserHeader from './file_browser_header'
import Settings from './settings'
import StatusBar from './status_bar'

export default class App extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
    }

    getStateFromModel()
    {
        var model = this.props.appModel;

        return {
            view: model.currentView,
        };
    }

    componentDidMount()
    {
        this.props.appModel.on('currentViewChange', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.appModel.off('currentViewChange', this.handleUpdate);
    }

    renderElements()
    {
        const view = this.state.view;
        const { appModel } = this.props;
        const { playerModel, playlistModel, fileBrowserModel, settingsModel } = appModel;

        if (view == ViewId.playlist)
        {
            return {
                header: (
                    <div className='panel-header'>
                        <PlaylistSwitcher
                            playlistModel={playlistModel}
                            settingsModel={settingsModel} />
                        <PlaylistMenu
                            playlistModel={playlistModel} />
                    </div>
                ),
                main:
                    <PlaylistContent
                        playlistModel={playlistModel} />
            };
        }

        if (view == ViewId.fileBrowser)
        {
            return {
                header:
                    <FileBrowserHeader
                        fileBrowserModel={fileBrowserModel}
                        playlistModel={playlistModel} />,

                main:
                    <FileBrowser
                        fileBrowserModel={fileBrowserModel}
                        playlistModel={playlistModel} />
            };
        }

        if (view == ViewId.settings)
        {
            return {
                header: <PanelHeader title='Settings' />,
                main: <Settings settingsModel={settingsModel} />
            };
        }

        return { header: null, main: null };
    }

    render()
    {
        const { appModel } = this.props;

        const elements = this.renderElements();

        return (
            <div className='app'>
                <ControlBar key='control-bar' appModel={appModel} />
                { elements.header }
                { elements.main }
                <StatusBar
                    key='status-bar'
                    playerModel={appModel.playerModel}
                    playlistModel={appModel.playlistModel} />
            </div>
        );
    }
}

App.propTypes = {
    appModel: PropTypes.instanceOf(AppModel).isRequired
};
