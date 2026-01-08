import React, { StrictMode } from 'react';
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import ServiceContext from './service_context.js'
import App from './app.js'
import AppModel from './app_model.js'
import urls, { getValueAfterHash } from './urls.js';
import { playlistTableKey } from './playlist_content.js';
import { PlaybackState } from 'beefweb-client';
import { SettingsView, View } from './navigation_model.js';
import { NotificationContainer } from './notification_container.js';

const appModel = new AppModel();

const {
    playerModel,
    playlistModel,
    fileBrowserModel,
    settingsModel,
    scrollManager,
    navigationModel,
} = appModel;

const router = new Navigo('/', { hash: true });
const noCallbacks = { callHandler: false, callHooks: false };

function navigate(url, options)
{
    const currentUrl = getValueAfterHash(router.getCurrentLocation().url);
    const requestedUrl = getValueAfterHash(url);

    if (currentUrl !== requestedUrl)
        router.navigate(requestedUrl, options);
}

function setCurrentUrl(url)
{
    navigate(url, noCallbacks);
}

router.on({
    '/': () => {
        navigate(urls.viewCurrentPlaylist);
    },

    '/playlists': () => {
        if (playlistModel.currentPlaylistId)
            navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
        else
            navigationModel.setView(View.playlist);
    },

    '/playlists/:id': match => {
        const { id } = match.data;
        playlistModel.setCurrentPlaylistId(id);
        navigationModel.setView(View.playlist);
    },

    '/files': () => {
        navigate(urls.browsePath(fileBrowserModel.currentPath));
    },

    '/files/!:path': match => {
        const { path } = match.data;

        navigationModel.setView(View.fileBrowser);

        if (path)
            fileBrowserModel.browse(path);

    },

    '/album-art': () => {
        navigationModel.setView(View.albumArt);
    },

    '/settings': () => {
        navigate(urls.settingsView(navigationModel.settingsView));
    },

    '/settings/:view': match => {
        const { view } = match.data;

        if (view in SettingsView)
        {
            navigationModel.setView(View.settings);
            navigationModel.setSettingsView(view);
        }
        else
        {
            navigationModel.setView(View.notFound);
        }
    },

    '/now-playing': () => {
        if (playerModel.playbackState === PlaybackState.stopped)
        {
            navigate(urls.viewCurrentPlaylist);
            return;
        }

        const { playlistId, index } = playerModel.activeItem;

        if (playlistId && index >= 0)
        {
            scrollManager.scrollToItem(playlistTableKey(playlistId), index);
            navigate(urls.viewPlaylist(playlistId));
        }
        else if (playlistId)
        {
            navigate(urls.viewPlaylist(playlistId));
        }
        else
        {
            navigate(urls.viewCurrentPlaylist);
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
        setCurrentUrl(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        setCurrentUrl(urls.viewCurrentPlaylist);
});

navigationModel.on('viewChange', () => {
    setCurrentUrl(urls.appView(navigationModel.view));
});

navigationModel.on('settingsViewChange', () => {
    if (navigationModel.view === View.settings)
        setCurrentUrl(urls.settingsView(navigationModel.settingsView));
});

fileBrowserModel.on('change', () => {
    if (navigationModel.view === View.fileBrowser)
        setCurrentUrl(urls.browsePath(fileBrowserModel.currentPath));
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
        <StrictMode>
            <ServiceContext.Provider value={appModel}>
                <App />
                <NotificationContainer />
            </ServiceContext.Provider>
        </StrictMode>
    );

    ReactDom.render(appComponent, document.getElementById('app-container'));
}

main();
