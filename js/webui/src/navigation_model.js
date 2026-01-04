import EventEmitter from 'wolfy87-eventemitter'

export const View = Object.freeze({
    playlist: 'playlist',
    fileBrowser: 'fileBrowser',
    albumArt: 'albumArt',
    settings: 'settings',
    notFound: 'notFound'
});

const viewOrder = [
    View.playlist,
    View.albumArt,
    View.fileBrowser,
    View.settings,
];

export const SettingsView = Object.freeze({
    general: 'general',
    columns: 'columns',
    output: 'output',
    defaults: 'defaults',
    about: 'about',
});

export default class NavigationModel extends EventEmitter
{
    constructor()
    {
        super();

        this.view = View.playlist;
        this.settingsView = SettingsView.general;

        this.defineEvent('viewChange');
        this.defineEvent('settingsViewChange');
    }

    setView(view)
    {
        if (view === this.view)
            return;

        this.view = view;
        this.emit('viewChange');
    }

    navigateToNext()
    {
        const currentIndex = viewOrder.indexOf(this.view);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % viewOrder.length : 0;
        this.setView(viewOrder[nextIndex]);
    }

    navigateToPrevious()
    {
        const currentIndex = viewOrder.indexOf(this.view);
        const prevIndex = currentIndex >= 0 ? (currentIndex + viewOrder.length - 1) % viewOrder.length : 0;
        this.setView(viewOrder[prevIndex]);
    }

    setSettingsView(view)
    {
        if (view === this.settingsView)
            return;

        this.settingsView = view;
        this.emit('settingsViewChange');
    }
}
