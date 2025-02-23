import ServiceContext from './service_context.js';
import React from 'react';
import ModelBinding from './model_binding.js';
import { bindHandlers } from './utils.js';
import { DialogButton } from './dialogs.js';
import { Select } from './elements.js';

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

        const { permissions } = this.context.playerModel;

        return {
            supportsMultipleOutputTypes,
            outputTypes,
            selectedOutputType,
            selectedOutputDevice,
            allowChangeOutput: permissions.changeOutput,
        };
    }

    render()
    {
        const { supportsMultipleOutputTypes, selectedOutputType, allowChangeOutput } = this.state;

        if (!selectedOutputType)
            return null;

        return <form className='settings-form'>
            { supportsMultipleOutputTypes ? this.renderOutputTypeSelector() : null }
            { this.renderOutputDeviceSelector() }
            <div className='settings-buttons'>
                <DialogButton type='apply' onClick={this.handleApply} disabled={!allowChangeOutput} />
                <DialogButton type='revert' onClick={this.handleRevert} disabled={!allowChangeOutput} />
            </div>
        </form>
    }

    renderOutputTypeSelector()
    {
        const { outputTypes, selectedOutputType, allowChangeOutput } = this.state;

        return <>
            <label className='setting-editor-label' htmlFor='output-type-selector'>Output type:</label>
            <Select id='output-type-selector'
                    selectedItemId={selectedOutputType.id}
                    items={outputTypes}
                    onChange={this.handleOutputTypeChange}
                    className='setting-editor-enum-large'
                    disabled={!allowChangeOutput} />
        </>;
    }

    renderOutputDeviceSelector()
    {
        const { selectedOutputType, selectedOutputDevice, allowChangeOutput } = this.state;

        return <>
            <label className='setting-editor-label' htmlFor='output-device-selector'>Output device:</label>
            <Select id='output-device-selector'
                    selectedItemId={selectedOutputDevice}
                    items={selectedOutputType.devices}
                    onChange={this.handleOutputDeviceChange}
                    className='setting-editor-enum-large'
                    disabled={!allowChangeOutput} />
        </>;
    }
}

export default ModelBinding(OutputSettings, {
    outputSettingsModel: 'change',
    playerModel: 'change'
});
