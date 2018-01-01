import React from 'react'
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import App from './app'
import { ApiClient } from './api_client'
import RequestHandler from './request_handler'
import SettingsStore from './settings_store'
import AppModel, { ViewId } from './app_model'
import MediaSizeController from './media_size_controller'
import TouchModeController from './touch_mode_controller'
import WindowController from './window_controller'
import CssSettingsController from './css_settings_controller'
import urls, { getPathFromUrl } from './urls'

const client = new ApiClient(new RequestHandler());
const settingsStore = new SettingsStore();
const appModel = new AppModel(client, settingsStore);

const { playerModel, playlistModel, fileBrowserModel, settingsModel } = appModel;

const mediaSizeController = new MediaSizeController(settingsModel);
const touchModeController = new TouchModeController(settingsModel);
const cssSettingsController = new CssSettingsController(settingsModel);
const windowController = new WindowController(playerModel);

const router = new Navigo(null, true);

function navigateToCurrentPlaylist()
{
    if (appModel.currentView != ViewId.playlist)
        return;

    router.pause();

    if (playlistModel.currentPlaylistId)
        router.navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        router.navigate(urls.viewCurrentPlaylist);

    router.resume();
}

router.on({
    '/': () => {
        router.navigate(urls.viewCurrentPlaylist);
    },

    '/playlists': () => {
        appModel.setCurrentView(ViewId.playlist);
        navigateToCurrentPlaylist();
    },

    '/playlists/:id': params => {
        playlistModel.setCurrentPlaylistId(params.id);
        appModel.setCurrentView(ViewId.playlist);
    },

    '/files': () => {
        fileBrowserModel.reload();
        appModel.setCurrentView(ViewId.fileBrowser);
        router.pause();
        router.navigate(urls.browsePath(fileBrowserModel.currentPath));
        router.resume();
    },

    '/files/!*': params => {
        appModel.setCurrentView(ViewId.fileBrowser);
        var path = getPathFromUrl(router.lastRouteResolved().url);
        fileBrowserModel.browse(path);
    },

    '/settings': () => {
        appModel.setCurrentView(ViewId.settings);
    },
});

router.notFound(() => {
    appModel.setCurrentView(ViewId.notFound);
});

playlistModel.on('playlistsChange', navigateToCurrentPlaylist);

appModel.load();
mediaSizeController.start();
touchModeController.start();
cssSettingsController.start();
appModel.start();
windowController.start();
router.resolve();

ReactDom.render(
    <App appModel={appModel} />,
    document.getElementById('app-container'));
