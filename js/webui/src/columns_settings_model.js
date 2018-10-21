import EventEmitter from 'wolfy87-eventemitter'
import cloneDeep from 'lodash/cloneDeep'
import { arrayMove } from 'react-sortable-hoc';

export default class ColumnsSettingsModel extends EventEmitter
{
    constructor(settingsModel)
    {
        super();

        this.settingsModel = settingsModel;
        this.columns = [];
        this.defineEvent('change');
    }

    apply()
    {
        this.settingsModel.columns = this.columns;
    }

    reset()
    {
        this.columns = cloneDeep(this.settingsModel.columns);
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
}
