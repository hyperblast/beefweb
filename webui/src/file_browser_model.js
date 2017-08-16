import EventEmitter from 'wolfy87-eventemitter'
import { getParentDir } from './utils'

export const rootPath = 'roots';

const fileTypeOrder = Object.freeze({
    D: 1,
    F: 2
});

function getFileTypeOrder(type)
{
    return fileTypeOrder[type] || 0;
}

function compareEntry(x, y)
{
    var order = getFileTypeOrder(x.type) - getFileTypeOrder(y.type);

    if (order)
        return order;

    return x.name.localeCompare(y.name);
}

export default class FileBrowserModel extends EventEmitter
{
    constructor(client)
    {
        super();

        this.client = client;
        this.currentPath = rootPath;
        this.entries = [];
        this.parentPath = null;
        this.roots = [];
        this.defineEvent('change');
    }

    browse(path)
    {
        if (path == rootPath)
        {
            this.client.getRoots().then(result =>
            {
                if (result)
                    this.endBrowse(path, result.roots);
            });
        }
        else
        {
            this.client.getDirectoryEntries(path).then(result =>
            {
                if (result)
                    this.endBrowse(path, result.entries);
            });
        }
    }

    reload()
    {
        this.browse(this.currentPath);
    }

    endBrowse(path, entries)
    {
        entries = entries.sort(compareEntry);

        if (path == rootPath)
        {
            this.roots = entries.map(e => e.path + '/');
            this.parentPath = null;
        }
        else
        {
            this.parentPath = this.getLogicalParentDir(path);
        }

        this.currentPath = path;
        this.entries = entries;
        this.emit('change');
    }

    getLogicalParentDir(path)
    {
        var parent = getParentDir(path);
        var parentWithSeparator = parent + '/';

        for (let root of this.roots)
        {
            if (parentWithSeparator.indexOf(root) == 0)
                return parent;
        }

        return rootPath;
    }
}
