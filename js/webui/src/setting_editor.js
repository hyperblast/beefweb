import React from 'react'
import PropTypes from 'prop-types'
import { values as objectValues } from 'lodash'
import { SettingType } from './settings_model.js'
import ServiceContext from './service_context.js';
import { DialogButton } from './dialogs.js';

class BoolSettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e)
    {
        this.context.settingsModel[this.props.settingKey] = e.target.checked;
    }

    render()
    {
        const { value, metadata, disabled } = this.props;

        return (
            <label className='setting-editor-bool'>
                <input type='checkbox' checked={value} onChange={this.handleInput} disabled={disabled} />
                <span className='setting-editor-bool-label'>{metadata.title}</span>
            </label>
        );
    }
}

BoolSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    value: PropTypes.bool.isRequired,
    metadata: PropTypes.object.isRequired,
    elementId: PropTypes.string.isRequired,
};

class EnumSettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e)
    {
        this.context.settingsModel[this.props.settingKey] = e.target.value;
    }

    render()
    {
        const { value, metadata, elementId, disabled } = this.props;

        const options = objectValues(metadata.enumKeys).map(value => {
            return (
                <option key={value} value={value}>
                    { metadata.enumNames[value] }
                </option>
            );
        });

        return (
            <React.Fragment>
                <label className='setting-editor-label' htmlFor={elementId}>{metadata.title + ':'}</label>
                <select
                    id={elementId}
                    className='setting-editor-enum'
                    value={value}
                    onChange={this.handleInput} disabled={disabled}>{ options }</select>
            </React.Fragment>
        );
    }
}

EnumSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    value: PropTypes.string.isRequired,
    metadata: PropTypes.object.isRequired,
    elementId: PropTypes.string.isRequired,
};

class TextSettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e)
    {
        this.context.settingsModel[this.props.settingKey] = e.target.value;
    }

    render()
    {
        const { value, metadata, elementId, disabled } = this.props;

        return (
            <React.Fragment>
                <label
                    htmlFor={elementId}
                    className='setting-editor-label'>{metadata.title + ':'}</label>
                <input
                    id={elementId}
                    className='setting-editor-text'
                    value={value}
                    onChange={this.handleInput}
                    disabled={disabled} />
            </React.Fragment>
        );
    }
}

TextSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    value: PropTypes.string.isRequired,
    metadata: PropTypes.object.isRequired,
    elementId: PropTypes.string.isRequired,
};

class PercentTextEditor extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.handleInput = this.handleInput.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    handleInput(e)
    {
        e.preventDefault();

        this.context.settingsModel[this.props.settingKey] = Number(e.target.value);
    }

    handleReset()
    {
        this.context.settingsModel.resetValueToDefault(this.props.settingKey);
    }

    render()
    {
        const { value, metadata, elementId, disabled } = this.props;

        return (
            <React.Fragment>
                <label className='setting-editor-label' htmlFor={elementId}>{metadata.title + ':'}</label>
                <div className='setting-editor-range-block'>
                    <input type='range'
                           id={elementId}
                           className='setting-editor-range'
                           value={value}
                           min={metadata.minValue}
                           max={metadata.maxValue}
                           step={metadata.step}
                           onChange={this.handleInput}
                           disabled={disabled} />
                    <div className='setting-editor-range-hint'>
                        {(value * 100).toFixed()}%
                    </div>
                    <DialogButton
                        type='reset'
                        disabled={disabled}
                        onClick={this.handleReset} />
                </div>
            </React.Fragment>
        );
    }
}

PercentTextEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    value: PropTypes.number.isRequired,
    metadata: PropTypes.object.isRequired,
    elementId: PropTypes.string.isRequired,
};

const editorComponents = Object.freeze({
    [SettingType.bool]: BoolSettingEditor,
    [SettingType.enum]: EnumSettingEditor,
    [SettingType.string]: TextSettingEditor,
    [SettingType.percent]: PercentTextEditor,
});

function EmptyEditor(props)
{
    return <div>Unknown setting type: {props.metadata.type}</div>
}

export default class SettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
    }

    getStateFromModel()
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        return {
            value: settingsModel[settingKey],
            metadata: settingsModel.metadata[settingKey],
            elementId: settingKey.toLowerCase() + '-setting',
        };
    }

    componentDidMount()
    {
        this.context.settingsModel.on(this.props.settingKey + 'Change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.context.settingsModel.off(this.props.settingKey + 'Change', this.handleUpdate);
    }

    render()
    {
        const { settingKey, disabled } = this.props;
        const { value, metadata, elementId } = this.state;
        const Editor = editorComponents[metadata.type] ?? EmptyEditor;

        return <Editor
            settingKey={settingKey}
            disabled={disabled}
            value={value}
            metadata={metadata}
            elementId={elementId} />;
    }
}

SettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};
