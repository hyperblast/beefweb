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
            this.client
                .getFileSystemRoots()
                .then(r => this.endBrowse(path, r.roots, r.pathSeparator));
        }
        else
        {
            this.client
                .getFileSystemEntries(path)
                .then(r => this.endBrowse(path, r.entries, r.pathSeparator));
        }
    }

    reload()
    {
        this.browse(this.currentPath);
    }

    endBrowse(path, entries, separator)
    {
        entries = entries.sort(compareEntry);

        if (path == rootPath)
        {
            this.roots = entries.map(e => e.path + separator);
            this.parentPath = null;
        }
        else
        {
            this.parentPath = this.getLogicalParentDir(path, separator);
        }

        this.currentPath = path;
        this.entries = entries;
        this.emit('change');
    }

    getLogicalParentDir(path, separator)
    {
        var parent = getParentDir(path, separator);
        var parentWithSeparator = parent + separator;

        for (let root of this.roots)
        {
            if (parentWithSeparator.indexOf(root) == 0)
                return parent;
        }

        return rootPath;
    }
}
