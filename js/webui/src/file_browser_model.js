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
        this.roots = null;
        this.entries = [];
        this.parentPath = null;
        this.pathSeparator = null;
        this.pathStack = [];
        this.defineEvent('change');
    }

    async browse(path)
    {
        if (path === rootPath)
        {
            const result = await this.client.getFileSystemRoots();
            result.roots.sort(compareEntry);

            this.pathSeparator ??= result.pathSeparator;
            this.roots = this.entries = result.roots;

            this.pathStack = [rootEntry];
            this.currentPath = rootPath;
            this.parentPath = null;
        }
        else
        {
            this.roots ??= (await this.client.getFileSystemRoots()).roots;

            const result = await this.client.getFileSystemEntries(path);
            result.entries.sort(compareEntry);

            this.pathSeparator ??= result.pathSeparator;
            this.entries = result.entries;

            this.pathStack = this.buildPathStack(path);
            this.currentPath = path;
            this.parentPath = this.pathStack[this.pathStack.length - 2].path;
        }

        this.emit('change');
    }

    reload()
    {
        return this.browse(this.currentPath);
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
        lastItem.shortName = lastItem.path;

        items.push(rootEntry);
        return items.reverse();
    }

    isUnderRootPath(path)
    {
        return this.roots.some(root => isSubpath(root.path, path, this.pathSeparator));
    }
}
