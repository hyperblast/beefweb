import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types'
import { IconButton, Icon, Select } from './elements.js';
import ReactModal from 'react-modal';
import { ConfirmDialog, DialogButton } from './dialogs.js';
import { ColumnAlign } from './columns.js';
import { defineKeyedModelData, defineModelData, useServices } from './hooks.js';

const AlignItems = [
    {  id: ColumnAlign.left, name: 'Left' },
    {  id: ColumnAlign.center, name: 'Center' },
    {  id: ColumnAlign.right, name: 'Right' },
];

const useColumnList = defineModelData({
    selector: context => context.columnsSettingsModel.columns,
    updateOn: {
        columnsSettingsModel: 'change'
    }
});

const useColumn = defineKeyedModelData({
    selector: (context, columnId) => context.columnsSettingsModel.getColumn(columnId),
    updateOn: {
        columnsSettingsModel: 'change'
    }
});

function ColumnEditButton(props)
{
    const { columnId } = props;
    const model = useServices().columnsSettingsModel;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [columnData, setColumnData] = useState(null);
    const callbackDeps = [columnId, columnData];

    const changeTitle = useCallback(
        e => setColumnData({ ...columnData, title: e.target.value }),
        callbackDeps);

    const changeExpression = useCallback(
        e => setColumnData({ ...columnData, expression: e.target.value }),
        callbackDeps);

    const changeSize = useCallback(
        e => {
            const value = Number(e.target.value);

            if (!isNaN(value) && value >= 0)
                setColumnData({ ...columnData, size: value });
        },
        callbackDeps);

    const changeAlign = useCallback(
        e => setColumnData({ ...columnData, align: e.target.value }),
        callbackDeps);

    const changeBold = useCallback(
        e => setColumnData({ ...columnData, bold: e.target.checked }),
        callbackDeps);

    const changeItalic = useCallback(
        e => setColumnData({ ...columnData, italic: e.target.checked }),
        callbackDeps);

    const changeSmall = useCallback(
        e => setColumnData({ ...columnData, small: e.target.checked }),
        callbackDeps);

    const handleOpen = useCallback(
        () => {
            setColumnData({ ...model.getColumn(columnId) });
            setDialogOpen(true);
        },
        callbackDeps)

    const handleOk = useCallback(
        () => {
            model.updateColumn(columnData);
            setColumnData(null);
            setDialogOpen(false);
        },
        callbackDeps);

    const handleCancel = useCallback(
        () => {
            setColumnData(null);
            setDialogOpen(false);
        },
        callbackDeps);

    const icon = <IconButton name='cog' onClick={handleOpen} title='Edit'/>;

    if (!dialogOpen)
        return icon;

    return <>
        {icon}
        <ReactModal
            isOpen={true}
            onRequestClose={handleCancel}
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
                            value={columnData.title}
                            onChange={changeTitle}/>
                    </div>
                    <div className='dialog-row'>
                        <label className='dialog-label' htmlFor='expr'>Expression:</label>
                        <input
                            className='dialog-input'
                            type='text'
                            name='expr'
                            value={columnData.expression}
                            onChange={changeExpression}/>
                    </div>
                    <div className='dialog-row'>
                        <label className='dialog-label' htmlFor='size'>Size:</label>
                        <input
                            className='dialog-input'
                            type='text'
                            name='size'
                            value={columnData.size}
                            onChange={changeSize}/>
                    </div>
                    <div className='dialog-row'>
                        <label className='dialog-label' htmlFor='align'>Text align:</label>
                        <Select name='align'
                                className='dialog-input'
                                items={AlignItems}
                                onChange={changeAlign}
                                selectedItemId={columnData.align}/>
                    </div>
                    <div className='dialog-row'>
                        <span className='dialog-label'>Font attributes:</span>
                        <div className='dialog-checkbox-columns'>
                            <label>
                                <input className='dialog-checkbox' name='bold' type='checkbox'
                                       checked={columnData.bold} onChange={changeBold}/>
                                <span className='dialog-checkbox-label'>Bold</span>
                            </label>
                            <label>
                                <input className='dialog-checkbox' name='italic' type='checkbox'
                                       checked={columnData.italic} onChange={changeItalic}/>
                                <span className='dialog-checkbox-label'>Italic</span>
                            </label>
                            <label>
                                <input className='dialog-check-box' name='small' type='checkbox'
                                       checked={columnData.small} onChange={changeSmall}/>
                                <span className='dialog-checkbox-label'>Small</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className='dialog-footer'>
                    <DialogButton type='ok' onClick={handleOk}/>
                    <DialogButton type='cancel' onClick={handleCancel}/>
                </div>
            </form>
        </ReactModal>
    </>;
}

ColumnEditButton.propTypes = {
    columnId: PropTypes.number.isRequired,
};

function ColumnDeleteButton(props)
{
    const { columnId } = props;
    const model = useServices().columnsSettingsModel;
    const [dialogOpen, setDialogOpen] = useState(false);
    const column = useColumn(columnId);

    const handleOpen = useCallback(() => setDialogOpen(true), []);

    const handleOk = useCallback(
        () => {
            model.removeColumn(columnId)
            setDialogOpen(false);
        },
        [columnId]);

    const handleCancel = useCallback(() => setDialogOpen(false), [])

    const icon = <IconButton name='minus' onClick={handleOpen} title='Delete' />;

    if (!dialogOpen)
        return icon;

    const columnName = column.lineBreak ? 'line break' : `column ${column.title}`;

    return <>
        {icon}
        <ConfirmDialog
            isOpen={true}
            title='Delete column'
            message={`Do you want to delete ${columnName}?`}
            onOk={handleOk}
            onCancel={handleCancel} />
    </>
}

ColumnDeleteButton.propTypes = {
    columnId: PropTypes.number.isRequired,
};

function ColumnDragHandle()
{
    return <Icon name='ellipses' className='column-editor-drag-handle' />;
}

function EditableColumn(props)
{
    const { columnId } = props;
    const column = useColumn(columnId);

    let editButton;
    let columnInfo;

    if (column.lineBreak)
    {
        columnInfo = <div className='column-editor-main'>
            <span className='column-info-line-break'>{'\u2E3A Line break \u2E3A'}</span>
        </div>;
    }
    else
    {
        columnInfo = <div className='column-editor-main'>
            <span className='column-info-title'>{ column.title }</span>
            <span className='column-info-expression'>{ column.expression }</span>
        </div>;

        editButton = <ColumnEditButton columnId={columnId} />;
    }

    return (
        <div className='column-editor'>
            <div className='column-editor-side'>
                <ColumnDragHandle />
            </div>
            { columnInfo }
            <div className='column-editor-side'>
                <div className='button-bar'>
                    { editButton }
                    <ColumnDeleteButton columnId={columnId} />
                </div>
            </div>
        </div>
    );
}

EditableColumn.propTypes = {
    columnId: PropTypes.number.isRequired,
};

function EditableColumnList()
{
    const columns = useColumnList();

    const columnElements = columns.map(c => (
        <EditableColumn key={c.id} columnId={c.id} />
    ));

    return (
        <div className='column-editor-list'>
            {columnElements}
        </div>
    );
}

export function ColumnsSettings()
{
    return <EditableColumnList />;
}
