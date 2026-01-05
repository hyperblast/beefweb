import { getBaseName, getParentDir, isSubpath } from './utils.js'
import ModelBase from './model_base.js';

export const rootPath = 'roots';

const rootName = 'Music directories';

const rootEntry = Object.freeze({
    path: rootPath,
    shortName: rootName,
    longName: rootName
});

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
    const order = getFileTypeOrder(x.type) - getFileTypeOrder(y.type);

    if (order)
        return order;

    return x.name.localeCompare(y.name);
}

export default class FileBrowserModel extends ModelBase
{
    constructor(client)
    {
        super();

        this.client = client;
        this.currentPath = rootPath;
        this.entries = [];
        this.parentPath = null;
        this.roots = [];
        this.pathSeparator = '/';
        this.pathStack = [];
        this.defineEvent('change');
    }

    browse(path)
    {
        if (path === rootPath)
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
        this.pathSeparator = separator;
        this.currentPath = path;
        this.entries = entries.sort(compareEntry);

        if (path === rootPath)
        {
            this.roots = this.entries;
            this.pathStack = [rootEntry];
            this.parentPath = null;
        }
        else
        {
            this.pathStack = this.buildPathStack(path);
            this.parentPath = this.pathStack[this.pathStack.length - 2].path;
        }

        this.emit('change');
    }

    buildPathStack(path)
    {
        const items = [];

        do
        {
            items.push({
                shortName: getBaseName(path, this.pathSeparator),
                longName: path,
                path
            });

            path = getParentDir(path, this.pathSeparator);
        }
        while (path.length > 0 && this.isUnderRootPath(path));

        const lastItem = items[items.length - 1];
        lastItem.longName = lastItem.path;

        items.push(rootEntry);
        return items.reverse();
    }

    isUnderRootPath(path)
    {
        return this.roots.some(root => isSubpath(root.path, path, this.pathSeparator));
    }
}
