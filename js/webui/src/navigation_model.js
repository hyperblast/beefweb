import EventEmitter from 'wolfy87-eventemitter'

export const View = Object.freeze({
    playlist: 'playlist',
    fileBrowser: 'fileBrowser',
    settings: 'settings',
    notFound: 'notFound'
});

export const SettingsView = Object.freeze({
    client: 'client',
    columns: 'columns'
});

export default class NavigationModel extends EventEmitter
{
    constructor()
    {
        super();

        this.view = View.playlist;
        this.settingsView = SettingsView.client;

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

    setSettingsView(view)
    {
        if (view === this.settingsView)
            return;

        this.settingsView = view;
        this.emit('settingsViewChange');
    }
}
