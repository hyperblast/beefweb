import React from 'react'
import PropTypes from 'prop-types'
import AppModel, { ViewId } from './app_model'
import { SwitcherHeader } from './elements'
import ControlBar from './control_bar'
import PlaylistSwitcher from './playlist_switcher'
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
        var view = this.state.view;
        var appModel = this.props.appModel;

        if (view == ViewId.playlist)
        {
            return {
                header: <PlaylistSwitcher playlistModel={appModel.playlistModel} />,
                main: <PlaylistContent playlistModel={appModel.playlistModel} />
            };
        }

        if (view == ViewId.fileBrowser)
        {
            return {
                header:
                    <FileBrowserHeader
                        fileBrowserModel={appModel.fileBrowserModel}
                        playlistModel={appModel.playlistModel} />,

                main:
                    <FileBrowser
                        fileBrowserModel={appModel.fileBrowserModel}
                        playlistModel={appModel.playlistModel} />
            };
        }

        if (view == ViewId.settings)
        {
            return {
                header: <SwitcherHeader title='Settings' />,
                main: <Settings settingsModel={appModel.settingsModel} />
            };
        }

        return { header: null, main: null };
    }

    render()
    {
        var appModel = this.props.appModel;
        var elements = this.renderElements();

        return (
            <div className='app'>
                <ControlBar key='control-bar' appModel={appModel} />
                { elements.header }
                { elements.main }
                <StatusBar key='status-bar' playerModel={appModel.playerModel} playlistModel={appModel.playlistModel} />
            </div>
        );
    }
}

App.propTypes = {
    appModel: PropTypes.instanceOf(AppModel).isRequired
};
