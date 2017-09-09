import EventEmitter from 'wolfy87-eventemitter'

const standardPreset = Object.freeze({
    names: [
        'Artist',
        'Album',
        'Track No',
        'Title',
        'Duration'
    ],
    expressions: [
        '%artist%',
        '%album%',
        '%track%',
        '%title%',
        '%length%'
    ]
});

const compactPreset = Object.freeze({
    names: [
        'Artist',
        'Title'
    ],
    expressions: [
        '%artist%',
        '%title%'
    ]
});

export default class PlaylistModel extends EventEmitter
{
    constructor(client)
    {
        super();

        this.client = client;
        this.playlists = [];
        this.playlistItems = [];
        this.currentPlaylistId = null;
        this.itemsWatch = null;
        this.columns = standardPreset;

        this.defineEvent('playlistsChange');
        this.defineEvent('itemsChange');

        this.handleItemsUpdate = this.handleItemsUpdate.bind(this);
    }

    setPlaylists(playlists)
    {
        this.playlists = playlists;

        var currentPlaylist = playlists.find(p => p.id == this.currentPlaylistId);

        if (!currentPlaylist)
        {
            currentPlaylist = playlists.find(p => p.isCurrent);

            this.currentPlaylistId = currentPlaylist ? currentPlaylist.id : null;
            this.watchPlaylistItems();
        }

        this.currentPlaylist = currentPlaylist;
        this.emit('playlistsChange');
    }

    setCurrentPlaylistId(id)
    {
        if (id == this.currentPlaylistId)
            return;

        this.currentPlaylistId = id;
        this.currentPlaylist = this.playlists.find(p => p.id == id);
        this.emit('playlistsChange');

        this.watchPlaylistItems();
    }

    setPlaylistItems(items)
    {
        this.playlistItems = items;
        this.emit('itemsChange');
    }

    watchPlaylistItems()
    {
        if (this.itemsWatch)
        {
            this.itemsWatch.close();
            this.itemsWatch = null;
        }

        if (!this.currentPlaylistId)
            return;

        var request = {
            playlistItems: true,
            plref: this.currentPlaylistId,
            plrange: '0:1000',
            plcolumns: this.columns.expressions,
        };

        this.itemsWatch = this.client.subscribe(request, this.handleItemsUpdate);
    }

    handleItemsUpdate(result)
    {
        if (result && result.playlistItems)
            this.setPlaylistItems(result.playlistItems);
    }

    setCompactMode(enabled)
    {
        var newColumns = enabled ? compactPreset : standardPreset;

        if (this.columns === newColumns)
            return;

        this.columns = newColumns;
        this.watchPlaylistItems();
    }

    addItems(items)
    {
        this.client.addPlaylistItems(this.currentPlaylistId, items);
    }

    activateItem(index)
    {
        this.client.play(this.currentPlaylistId, index);
    }

    getNewPlaylistTitle()
    {
        var title = 'New Playlist';

        if (!this.playlists.find(p => p.title == title))
            return title;

        for (let index = 1; true; index++)
        {
            title = `New Playlist (${index})`;

            if (!this.playlists.find(p => p.title == title))
                return title;
        }
    }

    addPlaylist()
    {
        this.client.addPlaylist(this.getNewPlaylistTitle());
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
}
