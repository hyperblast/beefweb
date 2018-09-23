import React from 'react'
import PropTypes from 'prop-types'
import objectValues from 'lodash/values'
import SettingsModel, { SettingType } from './settings_model'

class BoolSettingEditor extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleInput = this.handleInput.bind(this);
    }

    componentDidMount()
    {
        this.props.settingsModel.on(this.props.settingKey + 'Change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.settingsModel.off(this.props.settingKey + 'Change', this.handleUpdate);
    }

    getStateFromModel()
    {
        const { settingKey, settingsModel } = this.props;

        return {
            value: settingsModel[settingKey],
            metadata: settingsModel.metadata[settingKey]
        };
    }

    handleInput(e)
    {
        const { settingKey, settingsModel } = this.props;

        settingsModel[settingKey] = e.target.checked;
    }

    render()
    {
        const { value, metadata } = this.state;

        return (
            <label>
                <input type='checkbox' checked={value} onChange={this.handleInput} />
                <span>{metadata.title}</span>
            </label>
        );
    }
}

BoolSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};

class EnumSettingEditor extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleInput = this.handleInput.bind(this);
    }

    componentDidMount()
    {
        this.props.settingsModel.on(this.props.settingKey + 'Change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.settingsModel.off(this.props.settingKey + 'Change', this.handleUpdate);
    }

    getStateFromModel()
    {
        const { settingKey, settingsModel } = this.props;

        return {
            value: settingsModel[settingKey],
            metadata:settingsModel.metadata[settingKey]
        };
    }

    handleInput(e)
    {
        const { settingKey, settingsModel } = this.props;

        settingsModel[settingKey] = e.target.value;
    }

    render()
    {
        const { value, metadata } = this.state;

        const options = objectValues(metadata.enumKeys).map(value => {
            return (
                <option key={value} value={value}>
                    { metadata.enumNames[value] }
                </option>
            );
        });

        return (
            <label>
                <span>{metadata.title + ':'}</span>
                <select value={value} onChange={this.handleInput}>{ options }</select>
            </label>
        );
    }
}

EnumSettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};

function SettingEditor(props)
{
    const { settingKey, settingsModel } = props;
    const metadata = settingsModel.metadata[settingKey];

    if (metadata.type === SettingType.bool)
        return (
            <BoolSettingEditor
                settingKey={settingKey}
                settingsModel={settingsModel} />
        );

    if (metadata.type === SettingType.enum)
        return (
            <EnumSettingEditor
                settingKey={settingKey}
                settingsModel={settingsModel} />
        );

    return null;
}

SettingEditor.propTypes = {
    settingKey: PropTypes.string.isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};

export default function GeneralSettings(props)
{
    const model = props.settingsModel;

    return (
        <form>
            <SettingEditor settingKey='fullWidth' settingsModel={model} />
            <SettingEditor settingKey='fontSize' settingsModel={model} />
            <SettingEditor settingKey='inputMode' settingsModel={model} />
        </form>
    );
}

GeneralSettings.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};
