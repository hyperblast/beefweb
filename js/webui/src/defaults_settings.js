import React from 'react';
import ServiceContext from './service_context.js';
import { bindHandlers } from './utils.js';

export default class DefaultsSettings extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        bindHandlers(this);
    }

    handleSaveAsDefault()
    {
        this.context.settingsModel.saveAsDefault();
    }

    handleResetToDefault()
    {
        this.context.settingsModel.resetToDefault();
    }

    handleClearDefault()
    {
        this.context.settingsModel.clearSavedDefault();
    }

    render()
    {
        return <div className='defaults-settings'>
            <div className='settings-section'>
                <button className='dialog-button' onClick={this.handleSaveAsDefault}>
                    Save current settings as default
                </button>
                <div className='setting-description'>
                    When opening web interface from new browser current settings will be used as initial configuration.
                </div>
            </div>
            <div className='settings-section-separator'/>
            <div className='settings-section'>
                <button className='dialog-button' onClick={this.handleResetToDefault}>
                    Reset current settings to default
                </button>
                <div className='setting-description'>
                    Reset settings in the current browser to values stored as default.
                </div>
            </div>
            <div className='settings-section-separator'/>
            <div className='settings-section'>
                <button className='dialog-button' onClick={this.handleClearDefault}>Reset defaults</button>
                <div className='setting-description'>
                    Remove stored default settings.
                </div>
            </div>
        </div>;
    }
}
