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
        if (!this.updating)
            this.revertChanges();
    }

    getColumn(id)
    {
        return this.columns.find(c => c.id === id);
    }

    getColumnIndex(id)
    {
        return this.columns.findIndex(c => c.id === id);
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
        this.config[this.layout].columns = columns;
        this.columns = columns;
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

    updateColumn(id, patch)
    {
        const index = this.getColumnIndex(id);
        if (index < 0)
            return;

        const newColumns = [... this.columns];
        newColumns[index] = Object.assign({}, this.columns[index], patch);
        this.setColumns(newColumns);
    }

    moveColumn(oldId, newId)
    {
        const oldIndex = this.getColumnIndex(oldId);
        const newIndex = this.getColumnIndex(newId);
        if (oldIndex < 0 || newIndex < 0)
            return;

        this.setColumns(arrayMove(this.columns, oldIndex, newIndex));
    }

    removeColumn(id)
    {
        const index = this.getColumnIndex(id);
        if (index < 0)
            return;

        this.setColumns(arrayRemove(this.columns, index));
    }
}
