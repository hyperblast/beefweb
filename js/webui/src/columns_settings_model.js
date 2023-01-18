import EventEmitter from 'wolfy87-eventemitter'
import { cloneDeep } from 'lodash'
import { arrayMove } from 'react-sortable-hoc';
import { arrayRemove } from './utils.js';

export default class ColumnsSettingsModel extends EventEmitter
{
    constructor(settingsModel)
    {
        super();

        this.settingsModel = settingsModel;
        this.columns = [];
        this.defineEvent('change');
    }

    load()
    {
        this.columns = cloneDeep(this.settingsModel.columns);
    }

    apply()
    {
        this.settingsModel.columns = this.columns;
    }

    revertChanges()
    {
        this.columns = cloneDeep(this.settingsModel.columns);
        this.emit('change');
    }

    resetToDefault()
    {
        this.columns = cloneDeep(this.settingsModel.metadata.columns.defaultValue);
        this.emit('change');
    }

    addColumn(column)
    {
        this.columns = [... this.columns, column];
        this.emit('change');
    }

    updateColumn(index, patch)
    {
        const newColumns = [... this.columns];
        newColumns[index] = Object.assign({}, this.columns[index], patch);
        this.columns = newColumns;
        this.emit('change');
    }

    moveColumn(oldIndex, newIndex)
    {
        this.columns = arrayMove(this.columns, oldIndex, newIndex);
        this.emit('change');
    }

    removeColumn(index)
    {
        this.columns = arrayRemove(this.columns, index);
        this.emit('change');
    }
}
