import EventEmitter from 'wolfy87-eventemitter'
import DataSource from './data_source'
import PlayerModel from './player_model'
import PlaylistModel from './playlist_model'
import FileBrowserModel from './file_browser_model'
import SettingsModel from './settings_model'
import NotificationModel from './notification_model';
import ScrollManager from './scroll_manager';

export const ViewId = Object.freeze({
    playlist: 'playlist',
    fileBrowser: 'fileBrowser',
    settings: 'settings',
    notFound: 'notFound'
});

export default class AppModel extends EventEmitter
{
    constructor(client, settingsStore)
    {
        super();

        this.client = client;
        this.currentView = ViewId.playlist;

        this.dataSource = new DataSource(client);
        this.settingsModel = new SettingsModel(settingsStore);
        this.playerModel = new PlayerModel(client, this.dataSource);
        this.playlistModel = new PlaylistModel(client, this.dataSource, this.settingsModel);
        this.fileBrowserModel = new FileBrowserModel(client);
        this.notificationModel = new NotificationModel();
        this.scrollManager = new ScrollManager();

        this.defineEvent('currentViewChange');
    }

    load()
    {
        this.settingsModel.load();
        this.notificationModel.load();
    }

    start()
    {
        this.playerModel.start();
        this.playlistModel.start();
        this.dataSource.start();
        this.fileBrowserModel.reload();
        this.notificationModel.start();
    }

    setCurrentView(view)
    {
        if (view === this.currentView)
            return;

        this.currentView = view;
        this.emit('currentViewChange');
    }
}
