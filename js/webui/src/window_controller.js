import { PlaybackState } from 'beefweb-client'

const stateToIcon = {
    [PlaybackState.playing]: '\u25B6\uFE0F',
    [PlaybackState.paused]: '\u23F8\uFE0F'
};

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
        this.handleUpdate();
    }

    handleUpdate()
    {
        const model = this.playerModel;
        const state = model.playbackState;

        window.document.title =
            state === PlaybackState.stopped
                ? model.info.title
                : stateToIcon[state] + ' ' + model.activeItem.columns[0] + ' - ' + model.info.title;
    }
}
