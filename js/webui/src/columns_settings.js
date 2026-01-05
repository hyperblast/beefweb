import React from 'react';
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { bindHandlers } from './utils.js';
import { IconButton, Icon } from './elements.js';
import ReactModal from 'react-modal';
import { ConfirmDialog, DialogButton } from './dialogs.js';
import { cloneDeep } from 'lodash'
import ModelBinding from './model_binding.js';
import ColumnsSettingsModel from './columns_settings_model.js';
import { Visibility } from './columns.js';
import { MediaSize } from './settings_model.js';
import ServiceContext from "./service_context.js";

class ColumnEditorDialog extends React.PureComponent
{
    constructor(props)
    {
        super(props);
        this.state = { };
        bindHandlers(this);
    }

    update(patch)
    {
        this.props.onUpdate(patch);
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

    setVisibility(e, size)
    {
        const { visibility } = this.props.column;
        const newVisibility = Object.assign({}, visibility, { [size]: e.target.checked });
        this.update({ visibility: newVisibility });
    }

    render()
    {
        const { isOpen, column, onOk, onCancel } = this.props;
        const { visibility } = column;

        const visibilityControls = [MediaSize.small, MediaSize.medium, MediaSize.large].map(size => (
            <div key={size} className='dialog-row'>
                <label className='dialog-label'>
                    <input
                        type='checkbox'
                        checked={visibility[size]}
                        onChange={e => this.setVisibility(e, size)} />
                    <span>Show in {size} layout</span>
                </label>
            </div>
        ));

        return (
            <ReactModal
                isOpen={isOpen}
                onRequestClose={onCancel}
                className='dialog column-editor-dialog'
                overlayClassName='dialog-overlay'
                ariaHideApp={false}>
                <form className='dialog-content'>
                    <div className='dialog-header'>Edit column</div>
                    <div className='dialog-body'>
                        <div className='dialog-row'>
                            <label className='dialog-label' htmlFor='title'>Title:</label>
                            <input
                                className='dialog-input'
                                type='text'
                                name='title'
                                value={column.title}
                                onChange={this.handleTitleChange} />
                        </div>
                        <div className='dialog-row'>
                            <label className='dialog-label' htmlFor='expr'>Expression:</label>
                            <input
                                className='dialog-input'
                                type='text'
                                name='expr'
                                value={column.expression}
                                onChange={this.handleExpressionChange} />
                        </div>
                        <div className='dialog-row'>
                            <label className='dialog-label' htmlFor='size'>Size:</label>
                            <input
                                className='dialog-input'
                                type='text'
                                name='size'
                                value={column.size}
                                onChange={this.handleSizeChange} />
                        </div>
                        { visibilityControls }
                    </div>
                    <div className='dialog-footer'>
                        <DialogButton type='ok' onClick={onOk} />
                        <DialogButton type='cancel' onClick={onCancel} />
                    </div>
                </form>
            </ReactModal>
        );
    }
}

ColumnEditorDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    column: PropTypes.object.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

function ColumnEditorDragHandle_()
{
    return <Icon name='ellipses' className='column-editor-drag-handle' />;
}

const ColumnEditorDragHandle = SortableHandle(ColumnEditorDragHandle_);

class ColumnEditor_ extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = Object.assign(
            { deleteDialogOpen: false }, ColumnEditor_.editDialogClosed());

        bindHandlers(this);
    }

    static editDialogClosed()
    {
        return {
            editDialogOpen: false,
            editedColumn: {
                title: '',
                expression: '',
                size: 1,
                visibility: Visibility.never
            }
        };
    }

    handleEdit()
    {
        this.setState({
            editDialogOpen: true,
            editedColumn: cloneDeep(this.props.column),
        });
    }

    handleEditOk()
    {
        this.props.onUpdate(this.props.columnIndex, this.state.editedColumn);
        this.setState(ColumnEditor_.editDialogClosed);
    }

    handleEditCancel()
    {
        this.setState(ColumnEditor_.editDialogClosed);
    }

    handleEditUpdate(patch)
    {
        this.setState(state => ({ editedColumn: Object.assign({}, state.editedColumn, patch) }));
    }

    handleDelete()
    {
        this.setState({ deleteDialogOpen: true });
    }

    handleDeleteOk()
    {
        this.props.onDelete(this.props.columnIndex);
        this.setState({ deleteDialogOpen: false });
    }

    handleDeleteCancel()
    {
        this.setState({ deleteDialogOpen: false });
    }

    render()
    {
        const { column } = this.props;
        const { deleteDialogOpen, editDialogOpen, editedColumn } = this.state;

        return (
            <div className='column-editor'>
                <div className='column-editor-side'>
                    <ColumnEditorDragHandle />
                </div>
                <div className='column-editor-main'>
                    <span className='column-info-title'>{ column.title }</span>
                    <span className='column-info-expression'>{ column.expression }</span>
                </div>
                <div className='column-editor-side'>
                    <div className='button-bar'>
                        <IconButton name='cog' onClick={this.handleEdit} title='Edit' />
                        <IconButton name='minus' onClick={this.handleDelete} title='Delete' />
                    </div>
                </div>
                <ColumnEditorDialog
                    isOpen={editDialogOpen}
                    column={editedColumn}
                    onOk={this.handleEditOk}
                    onCancel={this.handleEditCancel}
                    onUpdate={this.handleEditUpdate} />
                <ConfirmDialog
                    isOpen={deleteDialogOpen}
                    title='Delete column'
                    message={`Do you want to delete column ${column.title}?`}
                    onOk={this.handleDeleteOk}
                    onCancel={this.handleDeleteCancel} />
            </div>
        );
    }
}

ColumnEditor_.propTypes = {
    columnIndex: PropTypes.number.isRequired,
    column: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

const ColumnEditor = SortableElement(ColumnEditor_);

class ColumnEditorList_ extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);
        this.state = this.getStateFromModel();
        bindHandlers(this);
    }

    getStateFromModel()
    {
        const { columns } = this.context.columnsSettingsModel;
        return { columns };
    }

    handleUpdate(index, patch)
    {
        this.context.columnsSettingsModel.updateColumn(index, patch);
    }

    handleDelete(index)
    {
        this.context.columnsSettingsModel.removeColumn(index);
    }

    render()
    {
        const editors = this.state.columns.map((c, i) => (
            <ColumnEditor
                key={i}
                index={i}
                columnIndex={i}
                column={c}
                onUpdate={this.handleUpdate}
                onDelete={this.handleDelete} />
        ));

        return (
            <div className='column-editor-list'>
                {editors}
            </div>
        );
    }
}

const ColumnEditorList = SortableContainer(ModelBinding(ColumnEditorList_, { columnsSettingsModel: 'change' }));

export default class ColumnsSettings extends React.PureComponent
{
    static contextType = ServiceContext;

    constructor(props)
    {
        super(props);

        this.state = {};

        bindHandlers(this);
    }

    handleSortEnd(e)
    {
        this.context.columnsSettingsModel.moveColumn(e.oldIndex, e.newIndex);
    }

    componentWillUnmount()
    {
        this.context.columnsSettingsModel.apply();
    }

    render()
    {
        return (
            <ColumnEditorList
                axis='y'
                lockAxis='y'
                useDragHandle={true}
                onSortEnd={this.handleSortEnd} />
        );
    }
}
