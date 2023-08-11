import React from 'react'
import PropTypes from 'prop-types'
import { values as objectValues } from 'lodash'
import { SettingType } from './settings_model.js'
import ServiceContext from './service_context.js';

class BoolSettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

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
            <label className='setting-editor-bool'>
                <input type='checkbox' checked={value} onChange={this.handleInput} disabled={disabled} />
                <span className='setting-editor-bool-label'>{metadata.title}</span>
            </label>
        );
    }
}

BoolSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};

class EnumSettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

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

        const options = objectValues(metadata.enumKeys).map(value => {
            return (
                <option key={value} value={value}>
                    { metadata.enumNames[value] }
                </option>
            );
        });

        const id = this.props.settingKey.toLowerCase() + '-cfg';

        return (
            <React.Fragment>
                <label className='setting-editor-label' htmlFor={id}>{metadata.title + ':'}</label>
                <select
                    id={id}
                    className='setting-editor-enum'
                    value={value}
                    onChange={this.handleInput} disabled={disabled}>{ options }</select>
            </React.Fragment>
        );
    }
}

EnumSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};

class TextSettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

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

        const id = this.props.settingKey.toLowerCase() + '-cfg';

        return (
            <React.Fragment>
                <label htmlFor={id} className='setting-editor-label'>{metadata.title + ':'}</label>
                <input id={id} className='setting-editor-text' value={value} onChange={this.handleInput} disabled={disabled} />
            </React.Fragment>
        );
    }
}

TextSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};

const editorComponents = Object.freeze({
    [SettingType.bool]: BoolSettingEditor,
    [SettingType.enum]: EnumSettingEditor,
    [SettingType.string]: TextSettingEditor,
});

export default class SettingEditor extends React.PureComponent
{
    static contextType = ServiceContext;

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

SettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    disabled: PropTypes.bool
};
