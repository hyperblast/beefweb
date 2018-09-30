import React from 'react';
import PropTypes from 'prop-types'
import cloneDeep from 'lodash/cloneDeep'
import SettingsModel from './settings_model';
import { bindHandlers } from './utils';

class ColumnEditor extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        bindHandlers(this);
    }

    handleTitleChange(e)
    {
        this.props.onUpdate(this.props.index, { title: e.target.value });
    }

    handleExpressionChange(e)
    {
        this.props.onUpdate(this.props.index, { expression: e.target.value });
    }

    handleSizeChange(e)
    {
        const value = Number(e.target.value);

        if (!isNaN(value) && value >= 0)
            this.props.onUpdate(this.props.index, { size: value });
    }

    render()
    {
        const { index, column } = this.props;

        const titleName = `title${index}`;
        const expressionName = `expr${index}`;
        const sizeName = `size${index}`;

        return (
            <div className='column-editor'>
                <div className='column-editor-block'>
                    <label className='column-editor-label' htmlFor={titleName}>Title:</label>
                    <input
                        className='column-editor-text column-editor-text-title'
                        type='text'
                        name={titleName}
                        value={column.title}
                        onChange={this.handleTitleChange} />
                </div>

                <div className='column-editor-block'>
                    <label className='column-editor-label' htmlFor={expressionName}>Expression:</label>
                    <input
                        className='column-editor-text column-editor-text-expression'
                        type='text'
                        name={expressionName}
                        value={column.expression}
                        onChange={this.handleExpressionChange} />
                </div>

                <div className='column-editor-block'>
                    <label className='column-editor-label' htmlFor={sizeName}>Size:</label>
                    <input
                        className='column-editor-text column-editor-text-size'
                        type='text'
                        name={sizeName}
                        value={column.size}
                        onChange={this.handleSizeChange} />
                </div>
            </div>
        );
    }
}

ColumnEditor.propTypes = {
    index: PropTypes.number.isRequired,
    column: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

export default class ColumnsSettings extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getInitialState();

        bindHandlers(this);
    }

    getInitialState()
    {
        return {
            columns: cloneDeep(this.props.settingsModel.columns)
        };
    }

    apply()
    {
        this.props.settingsModel.columns = this.state.columns;
    }

    reset()
    {
        this.setState(this.getInitialState());
    }

    handleColumnUpdate(index, patch)
    {
        const newColumns = [... this.state.columns];
        newColumns[index] = Object.assign({}, this.state.columns[index], patch);
        this.setState({ columns: newColumns });
    }

    componentWillUnmount()
    {
        this.apply();
    }

    render()
    {
        const editors = this.state.columns.map((c, i) => (
            <ColumnEditor key={i} index={i} column={c} onUpdate={this.handleColumnUpdate} />
        ));

        return (
            <form className='settings-form column-editor-list'>
                { editors }
            </form>
        );
    }
}

ColumnsSettings.propTypes = {
    settingsModel: PropTypes.instanceOf(SettingsModel).isRequired,
};
