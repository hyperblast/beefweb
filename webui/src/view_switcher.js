import React from 'react'
import PropTypes from 'prop-types'
import AppModel, { ViewId } from './app_model'
import { IconLink } from './elements'
import urls from './urls'

export default class ViewSwitcher extends React.PureComponent
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

    render()
    {
        const { view } = this.state;

        var playlistActive = view == ViewId.playlist ? 'active' : null;
        var fileBrowserActive = view == ViewId.fileBrowser ? 'active' : null;
        var settingsActive = view == ViewId.settings ? 'active' : null;

        return (
            <div className='view-switcher button-bar'>
                <IconLink name='list' href={urls.viewCurrentPlaylist} className={playlistActive} title='View playlists' />
                <IconLink name='folder' href={urls.browseCurrentPath} className={fileBrowserActive} title='Browse files' />
                <IconLink name='cog' href={urls.viewSettings} className={settingsActive} title='View settings' />
            </div>
        );
    }
}

ViewSwitcher.propTypes = {
    appModel: PropTypes.instanceOf(AppModel).isRequired
};
