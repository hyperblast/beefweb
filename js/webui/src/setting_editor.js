import React from 'react'
import PropTypes from 'prop-types'
import objectValues from 'lodash/values'
import SettingsModel, { SettingType } from './settings_model'
import ServiceContext from './service_context';

class BoolSettingEditor extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleInput = this.handleInput.bind(this);
    }

    componentDidMount()
    {
        this.context.settingsModel.on(this.props.settingKey + 'Change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.context.settingsModel.off(this.props.settingKey + 'Change', this.handleUpdate);
    }

    getStateFromModel()
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        return {
            value: settingsModel[settingKey],
            metadata: settingsModel.metadata[settingKey]
        };
    }

    handleInput(e)
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        settingsModel[settingKey] = e.target.checked;
    }

    render()
    {
        const { value, metadata } = this.state;
        const { disabled } = this.props;

        return (
            <label className='setting-editor setting-editor-bool'>
                <input type='checkbox' checked={value} onChange={this.handleInput} disabled={disabled} />
                <span>{metadata.title}</span>
            </label>
        );
    }
}

BoolSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};

BoolSettingEditor.contextType = ServiceContext;

class EnumSettingEditor extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleInput = this.handleInput.bind(this);
    }

    componentDidMount()
    {
        this.context.settingsModel.on(this.props.settingKey + 'Change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.context.settingsModel.off(this.props.settingKey + 'Change', this.handleUpdate);
    }

    getStateFromModel()
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        return {
            value: settingsModel[settingKey],
            metadata:settingsModel.metadata[settingKey]
        };
    }

    handleInput(e)
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        settingsModel[settingKey] = e.target.value;
    }

    render()
    {
        const { value, metadata } = this.state;
        const { disabled } = this.props;

        const options = objectValues(metadata.enumKeys).map(value => {
            return (
                <option key={value} value={value}>
                    { metadata.enumNames[value] }
                </option>
            );
        });

        return (
            <label className='setting-editor setting-editor-enum'>
                <span>{metadata.title + ':'}</span>
                <select value={value} onChange={this.handleInput} disabled={disabled}>{ options }</select>
            </label>
        );
    }
}

EnumSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};

EnumSettingEditor.contextType = ServiceContext;

class TextSettingEditor extends React.PureComponent
{
    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleInput = this.handleInput.bind(this);
    }

    componentDidMount()
    {
        this.context.settingsModel.on(this.props.settingKey + 'Change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.context.settingsModel.off(this.props.settingKey + 'Change', this.handleUpdate);
    }

    getStateFromModel()
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        return {
            value: settingsModel[settingKey],
            metadata: settingsModel.metadata[settingKey]
        };
    }

    handleInput(e)
    {
        const { settingKey } = this.props;
        const { settingsModel } = this.context;

        settingsModel[settingKey] = e.target.value;
    }

    render()
    {
        const { value, metadata } = this.state;
        const { disabled } = this.props;

        return (
            <label className='setting-editor setting-editor-text'>
                <span>{metadata.title + ':'}</span>
                <input value={value} onChange={this.handleInput} disabled={disabled} />
            </label>
        );
    }
}

TextSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};

TextSettingEditor.contextType = ServiceContext;

const editorComponents = Object.freeze({
    [SettingType.bool]: BoolSettingEditor,
    [SettingType.enum]: EnumSettingEditor,
    [SettingType.string]: TextSettingEditor,
});

export default class SettingEditor extends React.PureComponent
{
    render()
    {
        const { settingKey, disabled } = this.props;
        const { settingsModel } = this.context;
        const { type } = settingsModel.metadata[settingKey];
        const Editor = editorComponents[type];

        if (!Editor)
            throw new Error(`Setting property '${settingKey}' has unsupported type '${type}'.`);

        return <Editor settingKey={settingKey} disabled={disabled} />;
    }
}

SettingEditor.contextType = ServiceContext;

SettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};
