import EventEmitter from 'wolfy87-eventemitter'
import { cloneDeep } from 'lodash'
import { arrayMove } from 'react-sortable-hoc';
import { arrayRemove } from './utils.js';

export default class ColumnsSettingsModel extends EventEmitter
{
    constructor(settingsModel)
    {
        super();

        this.defineEvent('change');

        this.settingsModel = settingsModel;
        this.columns = [];
        this.updating = false;

        settingsModel.on('columnsChange', this.handleColumnsChange.bind(this));
    }

    handleColumnsChange()
    {
        if (this.updating)
            return;

        this.load();
        this.emit('change');
    }

    load()
    {
        this.columns = cloneDeep(this.settingsModel.columns);
    }

    apply()
    {
        this.updating = true;

        try
        {
            this.settingsModel.columns = cloneDeep(this.columns);
        }
        finally
        {
            this.updating = false;
        }
    }

    revertChanges()
    {
        this.columns = cloneDeep(this.settingsModel.columns);
        this.emit('change');
    }

    resetToDefault()
    {
        this.settingsModel.getDefaultValue('columns')
            .then(v => {
                this.columns = cloneDeep(v);
                this.emit('change');
            });
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
