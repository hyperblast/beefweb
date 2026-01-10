import { PlaybackState } from 'beefweb-client'
import { defineModelData } from './hooks.js';

const stateToIcon = {
    [PlaybackState.playing]: '\u25B6\uFE0F',
    [PlaybackState.paused]: '\u23F8\uFE0F'
};

const useWindowTitle = defineModelData({
    selector(context)
    {
        const { playbackState, info, activeItem } = context.playerModel;
        return playbackState === PlaybackState.stopped
            ? info.title
            : stateToIcon[playbackState] + ' ' + activeItem.columns[0] + ' - ' + info.title;
    },

    updateOn: {
        playerModel: 'change'
    }
});

export function WindowTitle()
{
    const title = useWindowTitle();
    return <title>{title}</title>
}
