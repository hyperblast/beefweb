import React from 'react'
import PropTypes from 'prop-types'
import AppModel, { ViewId } from './app_model'
import { Button } from './elements'
import urls from './urls'
import ModelBinding from './model_binding';

class ViewSwitcher extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { currentView } = this.props.appModel;
        return { view: currentView };
    }

    render()
    {
        const { view } = this.state;

        return (
            <div className='view-switcher button-bar'>
                <Button
                    name='list'
                    href={urls.viewCurrentPlaylist}
                    active={view == ViewId.playlist}
                    title='View playlists' />
                <Button
                    name='folder'
                    href={urls.browseCurrentPath}
                    active={view == ViewId.fileBrowser}
                    title='Browse files' />
                <Button
                    name='cog'
                    href={urls.viewSettings}
                    active={view == ViewId.settings}
                    title='View settings' />
            </div>
        );
    }
}

ViewSwitcher.propTypes = {
    appModel: PropTypes.instanceOf(AppModel).isRequired
};

export default ModelBinding(ViewSwitcher, { appModel: 'currentViewChange' });
