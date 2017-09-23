import EventEmitter from 'wolfy87-eventemitter'
import DataSource from './data_source'
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

        this.dataSource = new DataSource(client);
        this.playerModel = new PlayerModel(client, this.dataSource);
        this.playlistModel = new PlaylistModel(client, this.dataSource);
        this.fileBrowserModel = new FileBrowserModel(client);
        this.settingsModel = new SettingsModel();

        this.defineEvent('currentViewChange');
    }

    start()
    {
        this.settingsModel.load();
        this.playerModel.start();
        this.playlistModel.start();
        this.dataSource.start();
        this.fileBrowserModel.reload();
    }

    setCurrentView(view)
    {
        if (view == this.currentView)
            return;

        this.currentView = view;
        this.emit('currentViewChange');
    }
}
