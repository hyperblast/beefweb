import React from 'react';
import PropTypes from 'prop-types'
import { PanelHeaderTab } from './elements';
import NavigationModel, { SettingsViewMetadata } from './navigation_model';
import ModelBinding from './model_binding';
import urls from './urls';

class SettingsHeader extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { settingsView } = this.props.navigationModel;
        return { settingsView };
    }

    render()
    {
        const { settingsView } = this.state;

        const tabs = SettingsViewMetadata.map(value => (
            <PanelHeaderTab
                key={value.key}
                active={settingsView === value.key}
                href={urls.viewSettings(value.key)}
                title={value.title} />
        ));

        return (
            <div className='panel-header'>
                <ul className='header-block header-block-primary'>
                    { tabs }
                </ul>
            </div>
        );
    }
}

SettingsHeader.propTypes = {
    navigationModel: PropTypes.instanceOf(NavigationModel).isRequired,
};

export default ModelBinding(SettingsHeader, { navigationModel: 'settingsViewChange' });
