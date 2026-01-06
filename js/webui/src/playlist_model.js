import { arrayMove } from 'react-sortable-hoc'
import { AddAction } from "./settings_model.js";
import ModelBase from './model_base.js';

const addOptions = {
    [AddAction.add]: {},
    [AddAction.addAndPlay]: { play:true },
    [AddAction.replaceAndPlay]: { replace: true, play: true }
};

export default class PlaylistModel extends ModelBase
{
    constructor(client, dataSource, settingsModel)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;
        this.settingsModel = settingsModel;

        this.playlists = [];
        this.playlistsStale = false;

        this.playlistItems = { offset: 0, totalCount: 0, items: [] };
        this.playlistRange = { offset: 0, count: 100 };

        this.currentPlaylistId = '';
        this.columns = null;
        this.layout = null;

        this.defineEvent('playlistsChange');
        this.defineEvent('itemsChange');
    }

    start()
    {
        this.updateLayout();

        this.settingsModel.on('mediaSize', () => {
            if (this.updateLayout())
                this.watchPlaylistItems();
        });

        this.settingsModel.on('columns', () => {
            this.updateLayout(true);
            this.watchPlaylistItems();
        });

        this.dataSource.on('playlists', this.setPlaylists.bind(this));
        this.dataSource.on('playlistItems', this.setPlaylistItems.bind(this));
        this.dataSource.watch('playlists');
    }

    setPlaylists(playlists)
    {
        this.playlists = playlists;
        this.playlistsStale = false;

        let currentPlaylist = playlists.find(p => p.id === this.currentPlaylistId);

        if (currentPlaylist)
        {
            this.currentPlaylist = currentPlaylist;
            this.emit('playlistsChange');
            return;
        }

        currentPlaylist = playlists.find(p => p.isCurrent);
        this.currentPlaylistId = currentPlaylist ? currentPlaylist.id : '';
        this.currentPlaylist = currentPlaylist;

        this.playlistsStale = true;
        this.watchPlaylistItems(true);
    }

    setCurrentPlaylistId(id)
    {
        if (id === this.currentPlaylistId)
            return;

        this.currentPlaylistId = id;
        this.currentPlaylist = this.playlists.find(p => p.id === id);

        this.playlistsStale = true;
        this.watchPlaylistItems(true);
    }

    setPlaylistItems(playlistItems)
    {
        this.playlistItems = playlistItems;

        if (this.playlistsStale)
        {
            this.playlistsStale = false;
            this.emit('playlistsChange');
        }

        this.emit('itemsChange');
    }

    setItemsPage(offset, count)
    {
        this.playlistRange.offset = offset;
        this.playlistRange.count = count;
        this.watchPlaylistItems();
    }

    watchPlaylistItems(forceUpdate = false)
    {
        if (!this.currentPlaylistId)
            return;

        const request = {
            playlistItems: true,
            plref: this.currentPlaylistId,
            plcolumns: this.columns.filter(c => !c.lineBreak).map(c => c.expression),
            plrange: this.playlistRange,
        };

        this.dataSource.watch('playlistItems', request, forceUpdate);
    }

    updateLayout(forced = false)
    {
        const mediaSize = this.settingsModel.mediaSize;

        if (this.layout === mediaSize && !forced)
            return false;

        this.layout = mediaSize;
        this.columns = this.settingsModel.columns[mediaSize].columns;

        return true;
    }

    addItems(items, addAction)
    {
        if (!addAction) {
            addAction = this.settingsModel.defaultAddAction;
        }

        const options = addOptions[addAction];

        this.client.addPlaylistItems(this.currentPlaylistId, items, options);
    }

    activateItem(index)
    {
        this.client.play(this.currentPlaylistId, index);
    }

    getNewPlaylistTitle()
    {
        var title = 'New Playlist';

        if (!this.playlists.find(p => p.title === title))
            return title;

        for (let index = 1; true; index++)
        {
            title = `New Playlist (${index})`;

            if (!this.playlists.find(p => p.title === title))
                return title;
        }
    }

    movePlaylist(oldIndex, newIndex)
    {
        const oldPlaylists = this.playlists;

        if (oldIndex === newIndex
            || oldIndex > oldPlaylists.length
            || newIndex > oldPlaylists.length)
            return;

        const playlistId = oldPlaylists[oldIndex].id;

        const newPlaylists = oldPlaylists.map(p => {
            if (p.index === oldIndex)
                return Object.assign({}, p, { index: newIndex });
            else if (p.index === newIndex)
                return Object.assign({}, p, { index: oldIndex });
            return p;
        });

        this.setPlaylists(arrayMove(newPlaylists, oldIndex, newIndex));
        this.client.movePlaylist(playlistId, newIndex);
    }

    addPlaylist()
    {
        this.client.addPlaylist({ title: this.getNewPlaylistTitle() });
    }

    removePlaylist()
    {
        this.client.removePlaylist(this.currentPlaylistId);
    }

    renamePlaylist(title)
    {
        this.client.renamePlaylist(this.currentPlaylistId, title);
    }

    clearPlaylist()
    {
        this.client.clearPlaylist(this.currentPlaylistId);
    }

    removeItem(index)
    {
        this.client.removePlaylistItems(this.currentPlaylistId, [index]);
    }

    sortPlaylist(column, desc = false)
    {
        switch (typeof column)
        {
            case 'string':
                this.client.sortPlaylistItems(this.currentPlaylistId, { by: column, desc });
                break;

            case 'object':
                if (column.random)
                    this.client.sortPlaylistItems(this.currentPlaylistId, { random: true });
                else
                    this.client.sortPlaylistItems(this.currentPlaylistId, { by: column.expression, desc });
                break;

            default:
                throw new TypeError(`Invalid column type: ${typeof column}`);
        }
    }
}
