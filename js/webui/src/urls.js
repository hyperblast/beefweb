const urls = Object.freeze({
    viewCurrentPlaylist: '#/playlists',

    viewPlaylist(id)
    {
        return `#/playlists/${encodeURIComponent(id)}`;
    },

    browseCurrentPath: '#/files',

    browsePath(path)
    {
        return `#/files/!${encodeURIComponent(path)}`;
    },

    viewCurrentSettings: '#/settings',

    viewSettings(view)
    {
        return `#/settings/${view}`;
    },

    nowPlaying: '#/now-playing',
});

export default urls;

export function getPathFromUrl(url)
{
    return decodeURIComponent(url.split('!', 2)[1]);
}
