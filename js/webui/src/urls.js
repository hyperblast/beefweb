import { View } from './navigation_model.js';

const playlists = '#/playlists';
const settings = '#/settings';
const albumArt = '#/album-art';
const fileBrowser = '#/files';

const appViewToUrl = {
    [View.playlist]: playlists,
    [View.albumArt]: albumArt,
    [View.fileBrowser]: fileBrowser,
    [View.settings]: settings,
};

const urls = Object.freeze({
    viewCurrentPlaylist: playlists,

    viewPlaylist(id) {
        return `${playlists}/${encodeURIComponent(id)}`;
    },

    browseCurrentPath: fileBrowser,

    browsePath(path)
    {
        return `${fileBrowser}/!${encodeURIComponent(path)}`;
    },

    viewCurrentSettings: settings,
    viewAlbumArt: albumArt,

    appView(view)
    {
        return appViewToUrl[view]
    },

    settingsView(view)
    {
        return `#/settings/${view}`;
    },

    nowPlaying: '#/now-playing',
});

export default urls;

export function getValueAfterHash(url)
{
    const pos = url.indexOf('#');
    return pos >= 0 ? url.substring(pos + 1) : url;
}
