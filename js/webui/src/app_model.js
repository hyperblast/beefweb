import DataSource from './data_source.js'
import PlayerModel from './player_model.js'
import PlaylistModel from './playlist_model.js'
import FileBrowserModel from './file_browser_model.js'
import SettingsModel from './settings_model.js'
import NotificationModel from './notification_model.js'
import ScrollManager from './scroll_manager.js'
import NavigationModel from './navigation_model.js';
import ColumnsSettingsModel from './columns_settings_model.js';

export default class AppModel
{
    constructor(client, settingsStore)
    {
        this.client = client;
        this.dataSource = new DataSource(client);
        this.settingsModel = new SettingsModel(settingsStore);
        this.columnsSettingsModel = new ColumnsSettingsModel(this.settingsModel);
        this.playerModel = new PlayerModel(client, this.dataSource, this.settingsModel);
        this.playlistModel = new PlaylistModel(client, this.dataSource, this.settingsModel);
        this.fileBrowserModel = new FileBrowserModel(client);
        this.notificationModel = new NotificationModel();
        this.navigationModel = new NavigationModel();
        this.scrollManager = new ScrollManager();

        Object.freeze(this);
    }

    load()
    {
        this.settingsModel.load();
        this.notificationModel.load();
        this.columnsSettingsModel.load();
    }

    start()
    {
        this.playerModel.start();
        this.playlistModel.start();
        this.dataSource.start();
        this.fileBrowserModel.reload();
        this.notificationModel.start();
    }
}
