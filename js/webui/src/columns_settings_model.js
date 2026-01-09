import { arrayMove } from 'react-sortable-hoc';
import { arrayRemove } from './utils.js';
import ModelBase from './model_base.js';
import { MediaSize } from './settings_model.js';

let nextColumnId = 0;

function modifyColumns(config, callback)
{
    config = structuredClone(config);

    for (let mediaSize in MediaSize)
    {
        for (let column of config[mediaSize].columns)
            callback(column);
    }

    return config;
}

function addColumnIds(config)
{
    return modifyColumns(config, c => c.id = nextColumnId++);
}

function removeColumnIds(config)
{
    return modifyColumns(config, c => delete c.id);
}

export default class ColumnsSettingsModel extends ModelBase
{
    constructor(settingsModel)
    {
        super();

        this.defineEvent('change');

        this.settingsModel = settingsModel;
        this.layout = null;
        this.config = null;
        this.columns = null;
        this.updating = false;
    }

    start()
    {
        this.settingsModel.on('columns', this.handleColumnsChange.bind(this));
        this.layout ??= this.settingsModel.mediaSize;
        this.revertChanges();
    }

    handleColumnsChange()
    {
        if (this.updating)
            return;

        this.revertChanges();
        this.emit('change');
    }

    setLayout(mediaSize)
    {
        this.layout = mediaSize;
        this.columns = this.config[mediaSize].columns;
        this.emit('change');
    }

    setConfig(config)
    {
        this.config = addColumnIds(config);
        this.columns = this.config[this.layout].columns;
        this.emit('change');
    }

    setColumns(columns)
    {
        this.columns = columns;
        this.config[this.layout].columns = columns;
        this.emit('change');
    }

    applyChanges()
    {
        this.updating = true;

        try
        {
            this.settingsModel.columns = removeColumnIds(this.config);
        }
        finally
        {
            this.updating = false;
        }
    }

    revertChanges()
    {
        this.setConfig(this.settingsModel.columns);
    }

    async resetToDefault()
    {
        this.setConfig(await this.settingsModel.getDefaultValue('columns'));
    }

    addColumn(column)
    {
        column = structuredClone(column);
        column.id = nextColumnId++;
        this.setColumns([... this.columns, column]);
    }

    updateColumn(index, patch)
    {
        const newColumns = [... this.columns];
        newColumns[index] = Object.assign({}, this.columns[index], patch);
        this.setColumns(newColumns);
    }

    moveColumn(oldIndex, newIndex)
    {
        this.setColumns(arrayMove(this.columns, oldIndex, newIndex));
    }

    removeColumn(index)
    {
        this.setColumns(arrayRemove(this.columns, index));
    }
}
