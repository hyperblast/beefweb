import React from 'react'
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import { PlayerClient } from 'beefweb-client'
import App from './app'
import RequestHandler from './request_handler'
import SettingsStore from './settings_store'
import AppModel, { ViewId } from './app_model'
import MediaSizeController from './media_size_controller'
import TouchModeController from './touch_mode_controller'
import WindowController from './window_controller'
import CssSettingsController from './css_settings_controller'
import urls, { getPathFromUrl } from './urls'
import PlaylistContent from './playlist_content';
import { PlaybackState } from 'beefweb-client/src';

const client = new PlayerClient(new RequestHandler());
const settingsStore = new SettingsStore();
const appModel = new AppModel(client, settingsStore);

const { playerModel, playlistModel, fileBrowserModel, settingsModel, scrollManager } = appModel;

const mediaSizeController = new MediaSizeController(settingsModel);
const touchModeController = new TouchModeController(settingsModel);
const cssSettingsController = new CssSettingsController(settingsModel);
const windowController = new WindowController(playerModel);
const router = new Navigo(null, true);

router.on({
    '/': () => {
        router.navigate(urls.viewCurrentPlaylist);
    },

    '/playlists': () => {
        if (playlistModel.currentPlaylistId)
            router.navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
        else
            appModel.setCurrentView(ViewId.playlist);
    },

    '/playlists/:id': params => {
        playlistModel.setCurrentPlaylistId(params.id);
        appModel.setCurrentView(ViewId.playlist);
    },

    '/files': () => {
        router.navigate(urls.browsePath(fileBrowserModel.currentPath));
    },

    '/files/!*': () => {
        appModel.setCurrentView(ViewId.fileBrowser);
        const path = getPathFromUrl(router.lastRouteResolved().url);
        fileBrowserModel.browse(path);
    },

    '/settings': () => {
        appModel.setCurrentView(ViewId.settings);
    },

    '/now-playing': () => {
        if (playerModel.playbackState === PlaybackState.stopped)
        {
            router.navigate(urls.viewCurrentPlaylist);
            return;
        }

        const { playlistId, index } = playerModel.activeItem;

        if (playlistId && index >= 0)
        {
            scrollManager.scrollToItem(PlaylistContent.tableKey(playlistId), index);
            router.navigate(urls.viewPlaylist(playlistId));
        }
        else if (playlistId)
        {
            router.navigate(urls.viewPlaylist(playlistId));
        }
        else
        {
            router.navigate(urls.viewCurrentPlaylist);
        }
    }
});

router.notFound(() => {
    appModel.setCurrentView(ViewId.notFound);
});

playlistModel.on('playlistsChange', () => {

    if (appModel.currentView !== ViewId.playlist)
        return;

    if (playlistModel.currentPlaylistId)
        router.navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        router.navigate(urls.viewCurrentPlaylist);
});

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
