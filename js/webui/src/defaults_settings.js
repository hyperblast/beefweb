import React from 'react';
import ServiceContext from './service_context.js';

export default class DefaultsSettings extends React.PureComponent
{
    static contextType = ServiceContext;

    render()
    {
        return <div className='defaults-settings'>
            <div className='settings-section'>
                <button className='dialog-button'>Save current settings as default</button>
                <div className='setting-description'>
                    When opening web interface from new browser current settings will be used as initial configuration.
                </div>
            </div>
            <div className='settings-section-separator'/>
            <div className='settings-section'>
                <button className='dialog-button'>Reset current settings to default</button>
                <div className='setting-description'>
                    Reset settings in the current browser to values stored as default.
                </div>
            </div>
            <div className='settings-section-separator'/>
            <div className='settings-section'>
                <button className='dialog-button'>Reset defaults</button><br/>
                <div className='setting-description'>
                    Remove stored default settings.
                </div>
            </div>
        </div>;
    }
}