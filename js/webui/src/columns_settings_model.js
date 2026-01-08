import { arrayMove } from 'react-sortable-hoc';
import { arrayRemove } from './utils.js';
import ModelBase from './model_base.js';

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

    handleColumnsChange()
    {
        if (this.updating)
            return;

        this.load();
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
        this.config = structuredClone(config);
        this.columns = config[this.layout].columns;
        this.emit('change');
    }

    setColumns(columns)
    {
        this.columns = columns;
        this.config[this.layout].columns = columns;
        this.emit('change');
    }

    start()
    {
        this.settingsModel.on('columns', this.handleColumnsChange.bind(this));
        this.layout ??= this.settingsModel.mediaSize;
        this.revertChanges();
    }

    applyChanges()
    {
        this.updating = true;

        try
        {
            // SettingsModel clones value for us
            this.settingsModel.columns = this.config;
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
        this.setColumns([... this.columns, structuredClone(column)]);
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
