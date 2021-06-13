import React from 'react'
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import { PlayerClient } from 'beefweb-client'
import ServiceContext from './service_context'
import App from './app'
import RequestHandler from './request_handler'
import SettingsStore from './settings_store'
import AppModel from './app_model'
import MediaSizeController from './media_size_controller'
import TouchModeController from './touch_mode_controller'
import WindowController from './window_controller'
import CssSettingsController from './css_settings_controller'
import urls, { getPathFromUrl } from './urls'
import { playlistTableKey } from './playlist_content';
import { PlaybackState } from 'beefweb-client/src';
import { SettingsView, View } from './navigation_model';
import MediaSessionController from './mediasession_controller';

const client = new PlayerClient(new RequestHandler());
const settingsStore = new SettingsStore();
const appModel = new AppModel(client, settingsStore);

const {
    playerModel,
    playlistModel,
    fileBrowserModel,
    settingsModel,
    scrollManager,
    navigationModel,
} = appModel;

const mediaSizeController = new MediaSizeController(settingsModel);
const touchModeController = new TouchModeController(settingsModel);
const cssSettingsController = new CssSettingsController(settingsModel);
const windowController = new WindowController(playerModel);
const router = new Navigo(null, true);
const mediaSessionController = new MediaSessionController(playerModel);

router.on({
    '/': () => {
        router.navigate(urls.viewCurrentPlaylist);
    },

    '/playlists': () => {
        if (playlistModel.currentPlaylistId)
            router.navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
        else
            navigationModel.setView(View.playlist);
    },

    '/playlists/:id': params => {
        playlistModel.setCurrentPlaylistId(params.id);
        navigationModel.setView(View.playlist);
    },

    '/files': () => {
        router.navigate(urls.browsePath(fileBrowserModel.currentPath));
    },

    '/files/!*': () => {
        navigationModel.setView(View.fileBrowser);

        const path = getPathFromUrl(router.lastRouteResolved().url);

        if (path)
            fileBrowserModel.browse(path);
    },

    '/settings': () => {
        router.navigate(urls.viewSettings(navigationModel.settingsView));
    },

    '/settings/:view': params => {
        if (params.view in SettingsView)
        {
            navigationModel.setView(View.settings);
            navigationModel.setSettingsView(params.view);
        }
        else
            navigationModel.setView(View.notFound);
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
            scrollManager.scrollToItem(playlistTableKey(playlistId), index);
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
    navigationModel.setView(View.notFound);
});

playerModel.on('trackSwitch', () => {
    if (!settingsModel.cursorFollowsPlayback)
        return;

    const { playlistId, index } = playerModel.activeItem;

    if (playlistId !== '' && index >= 0)
        scrollManager.scrollToItem(playlistTableKey(playlistId), index);
});

playlistModel.on('playlistsChange', () => {
    if (navigationModel.view !== View.playlist)
        return;

    if (playlistModel.currentPlaylistId)
        router.navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        router.navigate(urls.viewCurrentPlaylist);
});

settingsModel.on('enableNotificationChange', () => {
    if (settingsModel.enableNotification) {
        mediaSessionController.start();
    }
    else {
        mediaSessionController.stop();
    }
});

appModel.load();
mediaSizeController.start();
touchModeController.start();
cssSettingsController.start();
appModel.start();
windowController.start();
if (settingsModel.enableNotification) {
    mediaSessionController.start();
}
router.resolve();

const appComponent = (
    <ServiceContext.Provider value={appModel}>
        <App />
    </ServiceContext.Provider>
);

ReactDom.render(appComponent, document.getElementById('app-container'));
