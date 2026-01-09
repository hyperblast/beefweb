import React, { StrictMode } from 'react';
import ReactDom from 'react-dom'
import ServiceContext from './service_context.js'
import { App } from './app.js'
import AppModel from './app_model.js'
import urls from './urls.js';
import { playlistTableKey } from './playlist_content.js';
import { PlaybackState } from 'beefweb-client';
import { SettingsView, View } from './navigation_model.js';
import { NotificationContainer } from './notification_container.js';
import { Router } from './router.js';

const appModel = new AppModel();

const {
    playerModel,
    playlistModel,
    fileBrowserModel,
    settingsModel,
    scrollManager,
    navigationModel,
} = appModel;

const router = new Router(navigationModel);

function viewCurrentPlaylist()
{
    router.setView(View.playlist);

    if (playlistModel.currentPlaylistId)
        router.replaceUrl(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        router.replaceUrl(urls.viewCurrentPlaylist);
}

async function viewFileBrowser(match)
{
    const { path } = match.data;
    router.setView(View.fileBrowser);
    await fileBrowserModel.browse(path)
}

router.on({
    '/': () => viewCurrentPlaylist,
    '/playlists': viewCurrentPlaylist,

    '/playlists/:id': match => {
        const { id } = match.data;
        router.update(() => playlistModel.setCurrentPlaylistId(id));
        router.setView(View.playlist);
    },

    '/files': async () => {
        if (router.setView(View.fileBrowser))
            fileBrowserModel.reload();

        router.replaceUrl(urls.browsePath(fileBrowserModel.currentPath));
    },

    // legacy route
    '/files/!:path': async match => {
        router.replaceUrl(urls.browsePath(match.data.path))
        await viewFileBrowser(match);
    },

    '/files/:path': viewFileBrowser,

    '/album-art': () => router.setView(View.albumArt),

    '/settings': () => {
        router.setView(View.settings);
        router.replaceUrl(urls.settingsView(navigationModel.settingsView));
    },

    '/settings/:view': match => {
        const { view } = match.data;

        if (view in SettingsView)
        {
            router.setView(View.settings);
            router.setSettingsView(view);
        }
        else
        {
            router.setView(View.notFound);
        }
    },

    '/now-playing': () => {
        if (playerModel.playbackState === PlaybackState.stopped)
        {
            viewCurrentPlaylist();
            return;
        }

        const { playlistId, index } = playerModel.activeItem;

        if (playlistId && index >= 0)
        {
            scrollManager.scrollToItem(playlistTableKey(playlistId), index);
            router.update(() => playlistModel.setCurrentPlaylistId(playlistId));
            router.setView(View.playlist);
            router.replaceUrl(urls.viewPlaylist(playlistId));
        }
        else
        {
            viewCurrentPlaylist();
        }
    }
});

router.notFound(() => {
    router.setView(View.notFound);
});

playerModel.on('trackSwitch', () => {
    if (!settingsModel.cursorFollowsPlayback)
        return;

    const { playlistId, index } = playerModel.activeItem;

    if (playlistId && index >= 0)
        scrollManager.scrollToItem(playlistTableKey(playlistId), index);
});

router.onModelEvent(playlistModel, 'playlistsChange', () => {
    if (navigationModel.view !== View.playlist)
        return;

    if (playlistModel.currentPlaylistId)
        router.pushUrl(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        router.pushUrl(urls.viewCurrentPlaylist);
});

router.onModelEvent(navigationModel, 'viewChange', () => {
    router.pushUrl(urls.appView(navigationModel.view));
});

router.onModelEvent(navigationModel, 'settingsViewChange', () => {
    if (navigationModel.view === View.settings)
        router.pushUrl(urls.settingsView(navigationModel.settingsView));
});

router.onModelEvent(fileBrowserModel, 'change', () => {
    if (navigationModel.view === View.fileBrowser)
        router.pushUrl(urls.browsePath(fileBrowserModel.currentPath));
});

async function main()
{
    await appModel.start();

    router.start();

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
