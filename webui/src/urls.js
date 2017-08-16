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

    viewSettings: '#/settings'
});

export default urls;

export function getPathFromUrl(url)
{
    return decodeURIComponent(url.split('!', 2)[1]);
}
