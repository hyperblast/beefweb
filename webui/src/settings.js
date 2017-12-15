import React from 'react'
import PropTypes from 'prop-types'
import SettingsModel, { FontSize, InputMode } from './settings_model'

const FontSizeNames = Object.freeze({
    [FontSize.small]: 'Small',
    [FontSize.normal]: 'Normal',
    [FontSize.large]: 'Large'
});

const InputModeNames = Object.freeze({
    [InputMode.auto]: 'Auto',
    [InputMode.forceMouse]: 'Force mouse',
    [InputMode.forceTouch]: 'Force touch'
});

class BooleanSetting extends React.PureComponent
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
        this.props.settingsModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.settingsModel.off('change', this.handleUpdate);
    }

    getStateFromModel()
    {
        return {
            value: this.props.settingsModel[this.props.settingKey]
        };
    }

    handleInput()
    {
        const model = this.props.settingsModel;
        model.fullWidth = !model.fullWidth;
    }

    render()
    {
        return (
            <label>
                <input type='checkbox' checked={this.state.value} onChange={this.handleInput} />
                <span>{this.props.title}</span>
            </label>
        );
    }
}

BooleanSetting.propTypes = {
    title: PropTypes.string.isRequired,
    settingKey: PropTypes.string.isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};

class EnumSetting extends React.PureComponent
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
        this.props.settingsModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.settingsModel.off('change', this.handleUpdate);
    }

    getStateFromModel()
    {
        return {
            value: this.props.settingsModel[this.props.settingKey]
        };
    }

    handleInput(e)
    {
        this.props.settingsModel[this.props.settingKey] = String(e.target.value);
    }

    render()
    {
        const { enumValues, enumNames, title } = this.props;

        const options = Object.keys(enumValues).map(key => {
            const value = enumValues[key];

            return (
                <option key={value} value={value}>
                    { enumNames[value] }
                </option>
            );
        });

        return (
            <label>
                <span>{title + ':'}</span>
                <select value={this.state.value} onChange={this.handleInput}>{ options }</select>
            </label>
        );
    }
}

EnumSetting.propTypes = {
    title: PropTypes.string.isRequired,
    settingKey: PropTypes.string.isRequired,
    enumValues: PropTypes.object.isRequired,
    enumNames: PropTypes.object.isRequired,
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};

export default function Settings(props)
{
    const model = props.settingsModel;

    return (
        <div className='panel main-panel settings'>
            <form>
                <BooleanSetting
                    settingsModel={model}
                    settingKey='fullWidth'
                    title='Use full screen width' />
                <EnumSetting
                    settingsModel={model}
                    settingKey='fontSize'
                    enumValues={FontSize}
                    enumNames={FontSizeNames}
                    title='Font size' />
                <EnumSetting
                    settingsModel={model}
                    settingKey='inputMode'
                    enumValues={InputMode}
                    enumNames={InputModeNames}
                    title='Input mode' />
            </form>
        </div>
    );
}

Settings.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};
