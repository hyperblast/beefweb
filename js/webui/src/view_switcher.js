import React from 'react'
import PropTypes from 'prop-types'
import { Button } from './elements.js'
import urls from './urls.js'
import ModelBinding from './model_binding.js';
import NavigationModel, { View } from './navigation_model.js';

class ViewSwitcher extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { view } = this.props.navigationModel;
        return { view };
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
                    title='View playlists' />
                <Button
                    name='folder'
                    href={urls.browseCurrentPath}
                    active={view === View.fileBrowser}
                    title='Browse files' />
                <Button
                    name='cog'
                    href={urls.viewCurrentSettings}
                    active={view === View.settings}
                    title='View settings' />
            </div>
        );
    }
}

ViewSwitcher.propTypes = {
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired
};

export default ModelBinding(ViewSwitcher, { navigationModel: 'viewChange' });
