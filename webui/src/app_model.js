import EventEmitter from 'wolfy87-eventemitter'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import FileBrowserModel from './file_browser_model'
import SettingsModel from './settings_model'

export const ViewId = Object.freeze({
    playlist: 'playlist',
    fileBrowser: 'fileBrowser',
    settings: 'settings',
    notFound: 'notFound'
});

export default class AppModel extends EventEmitter
{
    constructor(client)
    {
        super();

        this.client = client;
        this.currentView = ViewId.playlist;
        this.eventSource = null;

        this.playerModel = new PlayerModel(client);
        this.playlistModel = new PlaylistModel(client);
        this.fileBrowserModel = new FileBrowserModel(client);
        this.settingsModel = new SettingsModel();

        this.defineEvent('currentViewChange');
        this.handleEvent = this.handleEvent.bind(this);
    }

    start()
    {
        this.settingsModel.load();
        this.watchEvents();
        this.fileBrowserModel.reload();
    }

    setCurrentView(view)
    {
        if (view == this.currentView)
            return;

        this.currentView = view;
        this.emit('currentViewChange');
    }

    handleEvent(result, error)
    {
        if (error)
            return;

        if (result.player)
            this.playerModel.update(result.player);

        if (result.playlists)
            this.playlistModel.setPlaylists(result.playlists);
    }

    watchEvents()
    {
        if (this.eventSource)
        {
            this.eventSource.close();
            this.eventSource = null;
        }

        var request = {
            player: true,
            playlists: true,
            trcolumns: ['%artist% - %title%']
        };

        this.eventSource = this.client.subscribe(request, this.handleEvent);
    }
}
