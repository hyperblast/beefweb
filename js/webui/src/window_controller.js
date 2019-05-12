import iconPlay from 'open-iconic/png/media-play-4x.png'
import iconPause from 'open-iconic/png/media-pause-4x.png'
import iconStop from 'open-iconic/png/media-stop-4x.png'
import { PlaybackState } from 'beefweb-client'

const stateToIcon = {
    [PlaybackState.playing]: iconPlay,
    [PlaybackState.paused]: iconPause,
    [PlaybackState.stopped]: iconStop
};

function setIcon(icon)
{
    let iconElement = document.getElementById('player-state-icon');

    if (iconElement)
    {
        iconElement.href = icon;
        return;
    }

    iconElement =  document.createElement('link');
    iconElement.id = 'player-state-icon';
    iconElement.rel = 'shortcut icon';
    iconElement.href = icon;

    document.head.appendChild(iconElement);
}

function stateEqual(x, y)
{
    return x.title === y.title && x.playbackState === y.playbackState;
}

export default class WindowController
{
    constructor(playerModel)
    {
        this.playerModel = playerModel;
        this.handleUpdate = this.handleUpdate.bind(this);
    }

    start()
    {
        this.playerModel.on('change', this.handleUpdate);

        this.state = {
            title: '',
            playbackState: ''
        };

        this.handleUpdate();
    }

    getStateFromModel()
    {
        const model = this.playerModel;
        const playbackState = model.playbackState;

        const title = playbackState !== PlaybackState.stopped
            ? model.activeItem.columns[0] + ' - ' + model.info.title
            : model.info.title;

        return { title, playbackState };
    }

    handleUpdate()
    {
        const state = this.getStateFromModel();

        if (stateEqual(this.state, state))
            return;

        this.state = state;

        window.document.title = state.title;
        setIcon(stateToIcon[state.playbackState]);
    }
}
