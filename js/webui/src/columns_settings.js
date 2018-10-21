import React  from 'react';
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { bindHandlers } from './utils';
import { Icon, Menu, MenuItem } from './elements';
import { DropdownButton } from './dropdown';
import ColumnsSettingsModel from './columns_settings_model';
import ModelBinding from './model_binding';

function ColumnEditorDragHandleInner()
{
    return <Icon name='ellipses' className='column-editor-drag-handle' />;
}

const ColumnEditorDragHandle = SortableHandle(ColumnEditorDragHandleInner);

class ColumnEditorInner extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = { optionsMenuOpen: false };

        bindHandlers(this);
    }

    handleTitleChange(e)
    {
        this.update({ title: e.target.value });
    }

    handleExpressionChange(e)
    {
        this.update({ expression: e.target.value });
    }

    handleSizeChange(e)
    {
        const value = Number(e.target.value);

        if (!isNaN(value) && value >= 0)
            this.update({ size: value });
    }

    handleOptionsMenuRequestOpen(value)
    {
        this.setState({ optionsMenuOpen: value });
    }

    handleMenuClick(e, size)
    {
        e.preventDefault();
        const { visibility } = this.props.column;
        const newVisibility = Object.assign({}, visibility, { [size]: !visibility[size] });
        this.update({ visibility: newVisibility });
    }

    update(patch)
    {
        this.props.onUpdate(this.props.columnIndex, patch);
    }

    render()
    {
        const { optionsMenuOpen } = this.state;
        const { columnIndex, column } = this.props;
        const { visibility } = column;

        const titleName = `title${columnIndex}`;
        const expressionName = `expr${columnIndex}`;
        const sizeName = `size${columnIndex}`;

        return (
            <div className='column-editor'>
                <div className='column-editor-side'>
                    <ColumnEditorDragHandle />
                </div>
                <div className='column-editor-main'>
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
                <div className='column-editor-side'>
                    <DropdownButton
                        title='Options'
                        iconName='cog'
                        direction='left'
                        isOpen={optionsMenuOpen}
                        onRequestOpen={this.handleOptionsMenuRequestOpen}>
                        <Menu>
                            <MenuItem
                                title='Show in small layout'
                                checked={visibility.small}
                                onClick={e => this.handleMenuClick(e, 'small')}/>
                            <MenuItem
                                title='Show in medium layout'
                                checked={visibility.medium}
                                onClick={e => this.handleMenuClick(e, 'medium')}/>
                            <MenuItem
                                title='Show in large layout'
                                checked={visibility.large}
                                onClick={e => this.handleMenuClick(e, 'large')}/>
                        </Menu>
                    </DropdownButton>
                </div>
            </div>
        );
    }
}

ColumnEditorInner.propTypes = {
    columnIndex: PropTypes.number.isRequired,
    column: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

const ColumnEditor = SortableElement(ColumnEditorInner);

class ColumnEditorListInner extends React.PureComponent
{
    constructor(props)
    {
        super(props);
        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { columns } = this.props.columnsSettingsModel;
        return { columns };
    }

    handleUpdate(index, patch)
    {
        this.props.columnsSettingsModel.updateColumn(index, patch);
    }

    render()
    {
        const editors = this.state.columns.map((c, i) => (
            <ColumnEditor
                key={i}
                index={i}
                columnIndex={i}
                column={c}
                onUpdate={this.handleUpdate} />
        ));

        return (
            <div className='column-editor-list'>
                {editors}
            </div>
        );
    }
}

ColumnEditorListInner.propTypes = {
    columnsSettingsModel: PropTypes.instanceOf(ColumnsSettingsModel).isRequired,
};

const ColumnEditorList = SortableContainer(ModelBinding(ColumnEditorListInner, { columnsSettingsModel: 'change' }));

export default class ColumnsSettings extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};

        bindHandlers(this);
    }

    handleSortEnd(e)
    {
        this.props.columnsSettingsModel.moveColumn(e.oldIndex, e.newIndex);
    }

    componentWillUnmount()
    {
        this.props.columnsSettingsModel.apply();
    }

    render()
    {
        return (
            <form>
                <ColumnEditorList
                    columnsSettingsModel={this.props.columnsSettingsModel}
                    axis='y'
                    lockAxis='y'
                    useDragHandle={true}
                    onSortEnd={this.handleSortEnd} />
            </form>
        );
    }
}

ColumnsSettings.propTypes = {
    columnsSettingsModel: PropTypes.instanceOf(ColumnsSettingsModel).isRequired,
};
