import React from 'react'
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import { PlayerClient } from 'beefweb-client'
import ServiceContext from './service_context.js'
import App from './app.js'
import RequestHandler from './request_handler.js'
import SettingsStore from './settings_store.js'
import AppModel from './app_model.js'
import MediaSizeController from './media_size_controller.js'
import TouchModeController from './touch_mode_controller.js'
import WindowController from './window_controller.js'
import CssSettingsController from './css_settings_controller.js'
import urls, { getPathFromUrl } from './urls.js'
import { playlistTableKey } from './playlist_content.js';
import { PlaybackState } from 'beefweb-client';
import { SettingsView, View } from './navigation_model.js';
import MediaThemeController from "./media_theme_controller.js";
import { debounce } from "lodash";

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
const mediaThemeController = new MediaThemeController(settingsModel);
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

appModel.load();

mediaSizeController.start();
mediaThemeController.start();
touchModeController.start();
cssSettingsController.start();
appModel.start();
windowController.start();
router.resolve();

const appContainer = document.getElementById('app-container');

function updateViewHeight()
{
    // Adjust view height to exclude area occupied by the browser controls

    if (settingsModel.touchMode)
    {
        appContainer.className = 'app-view-height-var';
        appContainer.style.setProperty('--view-height', `${window.innerHeight}px`);
        return;
    }

    if (appContainer.className !== '')
    {
        appContainer.className = '';
        appContainer.style.removeProperty('--view-height');
    }
}

updateViewHeight();
settingsModel.on('touchModeChange', updateViewHeight);
window.addEventListener('resize', debounce(updateViewHeight, 50));

const appComponent = (
    <ServiceContext.Provider value={appModel}>
        <App />
    </ServiceContext.Provider>
);

ReactDom.render(appComponent, appContainer);
