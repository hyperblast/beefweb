import React from 'react';
import PropTypes from 'prop-types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { bindHandlers } from './utils.js';
import { IconButton, Icon, Select } from './elements.js';
import ReactModal from 'react-modal';
import { ConfirmDialog, DialogButton } from './dialogs.js';
import { cloneDeep } from 'lodash'
import ModelBinding from './model_binding.js';
import ServiceContext from "./service_context.js";
import { ColumnAlign } from './columns.js';

const AlignItems = [
    {  id: ColumnAlign.left, name: 'Left' },
    {  id: ColumnAlign.center, name: 'Center' },
    {  id: ColumnAlign.right, name: 'Right' },
];

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

    handleAlignChange(e)
    {
        this.update({ align: e.target.value });
    }

    handleBoldChange(e)
    {
        this.update({ bold: e.target.checked });
    }

    handleItalicChange(e)
    {
        this.update({ italic: e.target.checked });
    }

    handleSmallChange(e)
    {
        this.update({ small: e.target.checked });
    }

    render()
    {
        const { isOpen, column, onOk, onCancel } = this.props;

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
                        <div className='dialog-row'>
                            <label className='dialog-label' htmlFor='align'>Align:</label>
                            <Select id='align'
                                    className='dialog-input'
                                    items={AlignItems}
                                    onChange={this.handleAlignChange}
                                    selectedItemId={column.align} />
                        </div>
                        <div className='dialog-row'>
                            <span className='dialog-label'>Font attributes:</span>
                            <div className='dialog-checkbox-columns'>
                                <label>
                                    <input className='dialog-checkbox' name='bold' type='checkbox'
                                           checked={column.bold || false} onChange={this.handleBoldChange}/>
                                    <span className='dialog-checkbox-label'>Bold</span>
                                </label>
                                <label>
                                    <input className='dialog-checkbox' name='italic' type='checkbox'
                                           checked={column.italic || false} onChange={this.handleItalicChange}/>
                                    <span className='dialog-checkbox-label'>Italic</span>
                                </label>
                                <label>
                                    <input className='dialog-check-box' name='small' type='checkbox'
                                           checked={column.small || false} onChange={this.handleSmallChange}/>
                                    <span className='dialog-checkbox-label'>Small</span>
                                </label>
                            </div>
                        </div>
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
                size: 1
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

        let editButton;
        let columnInfo;
        let columnName;

        if (column.lineBreak)
        {
            columnInfo = <div className='column-editor-main'>
                <span className='column-info-line-break'>{'\u2E3A Line break \u2E3A'}</span>
            </div>;

            columnName = 'line break';
        }
        else
        {
            columnInfo = <div className='column-editor-main'>
                <span className='column-info-title'>{ column.title }</span>
                <span className='column-info-expression'>{ column.expression }</span>
            </div>;

            editButton = <IconButton name='cog' onClick={this.handleEdit} title='Edit' />;
            columnName = `column ${column.title}`;
        }

        return (
            <div className='column-editor'>
                <div className='column-editor-side'>
                    <ColumnEditorDragHandle />
                </div>
                { columnInfo }
                <div className='column-editor-side'>
                    <div className='button-bar'>
                        { editButton }
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
                    message={`Do you want to delete ${columnName}?`}
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

const ColumnEditorList = SortableContainer(ModelBinding(
    ColumnEditorList_, { columnsSettingsModel: 'change' }));

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
        this.context.columnsSettingsModel.applyChanges();
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
