import React from 'react'
import PropTypes from 'prop-types'
import SettingsModel, { FontSize } from './settings_model'

const FontSizeNames = Object.freeze({
    [FontSize.small]: 'Small',
    [FontSize.normal]: 'Normal',
    [FontSize.large]: 'Large'
});

export default class Settings extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleFullWidthToggle = this.handleFullWidthToggle.bind(this);
        this.handleFontSizeChange = this.handleFontSizeChange.bind(this);
    }

    getStateFromModel()
    {
        return Object.assign({}, this.props.settingsModel.values);
    }

    componentDidMount()
    {
        this.props.settingsModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.settingsModel.off('change', this.handleUpdate);
    }

    handleFullWidthToggle()
    {
        var model = this.props.settingsModel;
        model.fullWidth = !model.fullWidth;
    }

    handleFontSizeChange(e)
    {
        var model = this.props.settingsModel;
        model.fontSize = String(e.target.value);
    }

    render()
    {
        var fullWidth = (
            <label>
                <input type='checkbox' checked={this.state.fullWidth} onChange={this.handleFullWidthToggle} />
                <span>Use full screen width</span>
            </label>
        );

        var fontSizeItems = Object.keys(FontSize).map(key => (
            <option key={key} value={key}>{ FontSizeNames[key] }</option>
        ));

        var fontSize = (
            <label>
                <span>Font size:</span>
                <select value={this.state.fontSize} onChange={this.handleFontSizeChange}>{ fontSizeItems }</select>
            </label>
        );

        return (
            <div className='panel main-panel settings'>
                <form>
                { fullWidth }
                { fontSize }
                </form>
            </div>
        );
    }
}

Settings.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired
};

