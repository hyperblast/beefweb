import { PlayerClient } from 'beefweb-client';
import RequestHandler from './request_handler.js';
import SettingsStore from './settings_store.js';
import DataSource from './data_source.js'
import PlayerModel from './player_model.js'
import PlaylistModel from './playlist_model.js'
import FileBrowserModel from './file_browser_model.js'
import SettingsModel from './settings_model.js'
import NotificationModel from './notification_model.js'
import ScrollManager from './scroll_manager.js'
import NavigationModel from './navigation_model.js';
import ColumnsSettingsModel from './columns_settings_model.js';
import PlayQueueModel from './play_queue_model.js';
import OutputSettingsModel from './output_settings_model.js';
import ViewSwitcherController from './view_switcher_controller.js';
import WindowController from './window_controller.js';
import MediaSizeController from './media_size_controller.js';
import MediaThemeController from './media_theme_controller.js';
import TouchModeController from './touch_mode_controller.js';
import CssSettingsController from './css_settings_controller.js';

export default class AppModel
{
    constructor()
    {
        this.client = new PlayerClient(new RequestHandler());
        this.settingsStore = new SettingsStore();
        this.dataSource = new DataSource(this.client);
        this.settingsModel = new SettingsModel(this.settingsStore, this.client);
        this.columnsSettingsModel = new ColumnsSettingsModel(this.settingsModel);
        this.playerModel = new PlayerModel(this.client, this.dataSource, this.settingsModel);
        this.playlistModel = new PlaylistModel(this.client, this.dataSource, this.settingsModel);
        this.playQueueModel = new PlayQueueModel(this.client, this.dataSource);
        this.outputSettingsModel = new OutputSettingsModel(this.client, this.dataSource);
        this.fileBrowserModel = new FileBrowserModel(this.client);
        this.notificationModel = new NotificationModel();
        this.navigationModel = new NavigationModel();
        this.scrollManager = new ScrollManager();
        this.viewSwitcherController = new ViewSwitcherController(this.navigationModel);
        this.mediaSizeController = new MediaSizeController(this.settingsModel);
        this.mediaThemeController = new MediaThemeController(this.settingsModel);
        this.touchModeController = new TouchModeController(this.settingsModel);
        this.cssSettingsController = new CssSettingsController(this.settingsModel);
        this.windowController = new WindowController(this.playerModel);

        Object.freeze(this);
    }

    async start()
    {
        await this.settingsModel.initialize();

        this.notificationModel.load();
        this.columnsSettingsModel.load();

        this.playerModel.start();
        this.playlistModel.start();
        this.playQueueModel.start();
        this.outputSettingsModel.start();
        this.dataSource.start();
        this.notificationModel.start();
        this.mediaSizeController.start();
        this.mediaThemeController.start();
        this.touchModeController.start();
        this.cssSettingsController.start();
        this.windowController.start();
    }
}

