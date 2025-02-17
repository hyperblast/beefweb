import ServiceContext from './service_context.js';
import React from 'react';
import ModelBinding from './model_binding.js';
import { bindHandlers } from './utils.js';
import { DialogButton } from './dialogs.js';

class OutputSettings extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();

        bindHandlers(this);
    }

    componentWillUnmount()
    {
        this.context.outputSettingsModel.revert();
    }

    handleOutputTypeChange(e)
    {
        this.context.outputSettingsModel.setOutputType(e.target.value);
    }

    handleOutputDeviceChange(e)
    {
        this.context.outputSettingsModel.setOutputDevice(e.target.value);
    }

    handleApply(e)
    {
        e.preventDefault();
        this.context.outputSettingsModel.apply();
    }

    handleRevert(e)
    {
        e.preventDefault();
        this.context.outputSettingsModel.revert();
    }

    getStateFromModel()
    {
        const {
            supportsMultipleOutputTypes,
            outputTypes,
            selectedOutputType,
            selectedOutputDevice,
        } = this.context.outputSettingsModel;

        return { supportsMultipleOutputTypes, outputTypes, selectedOutputType, selectedOutputDevice };
    }

    render()
    {
        const { supportsMultipleOutputTypes, selectedOutputType, selectedOutputDevice } = this.state;

        if (!selectedOutputType.id || !selectedOutputDevice)
            return null;

        return <form className='settings-form'>
            { supportsMultipleOutputTypes ? this.renderOutputTypeSelector() : null }
            { this.renderOutputDeviceSelector() }
            <span></span>
            <div>
                <DialogButton type='apply' onClick={this.handleApply} />
                <DialogButton type='revert' onClick={this.handleRevert} />
            </div>
        </form>
    }

    renderOutputTypeSelector()
    {
        const { selectedOutputType, outputTypes } = this.state;

        return <>
            <label className='setting-editor-label' htmlFor='output-type-selector'>Output type:</label>
            <select className='setting-editor-enum-large' id='output-type-selector'
                    value={selectedOutputType.id} onChange={this.handleOutputTypeChange}>
                {
                    outputTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                }
            </select>
        </>;
    }

    renderOutputDeviceSelector()
    {
        const { selectedOutputType, selectedOutputDevice } = this.state;

        return <>
            <label className='setting-editor-label' htmlFor='output-device-selector'>Output device:</label>
            <select className='setting-editor-enum-large' id='output-device-selector'
                    value={selectedOutputDevice} onChange={this.handleOutputDeviceChange}>
                {
                    selectedOutputType.devices.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                }
            </select>
        </>;
    }
}

export default ModelBinding(OutputSettings, { outputSettingsModel: 'change' });
