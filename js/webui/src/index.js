import React from 'react'
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import ServiceContext from './service_context.js'
import App from './app.js'
import AppModel from './app_model.js'
import urls, { getPathFromUrl } from './urls.js'
import { playlistTableKey } from './playlist_content.js';
import { PlaybackState } from 'beefweb-client';
import { SettingsView, View } from './navigation_model.js';

const appModel = new AppModel();

const {
    playerModel,
    playlistModel,
    fileBrowserModel,
    settingsModel,
    scrollManager,
    navigationModel,
} = appModel;


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

    '/album-art': () => {
        navigationModel.setView(View.albumArt);
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

async function main()
{
    await appModel.start();

    router.resolve();

    if (navigationModel.view !== View.fileBrowser)
    {
        fileBrowserModel.reload();
    }

    const appComponent = (
        <ServiceContext.Provider value={appModel}>
            <App />
        </ServiceContext.Provider>
    );

    ReactDom.render(appComponent, document.getElementById('app-container'));
}

main();
