import EventEmitter from 'wolfy87-eventemitter'
import { SwitchParam, PlaybackState } from './client'
import { clamp } from './utils'

const initialPlayerInfo = Object.freeze({
    playbackState: PlaybackState.stopped,
    volume: {
        dbMin: 0.0,
        db: 0.0,
        isMuted: false,
    },
    activeItem: {
        position: -1,
        duration: -1,
        columns: []
    }
});

export default class PlayerModel extends EventEmitter
{
    constructor(client)
    {
        super();

        this.client = client;
        Object.assign(this, initialPlayerInfo);
        this.updatePosition = this.updatePosition.bind(this);
        this.defineEvent('change');
    }

    play()
    {
        this.client.play();
    }

    stop()
    {
        this.client.stop();
    }

    pause()
    {
        this.client.togglePause();
    }

    next()
    {
        this.client.next();
    }

    previous()
    {
        this.client.previous();
    }

    mute()
    {
        this.client.setMuted(SwitchParam.toggle);
    }

    setVolume(value)
    {
        this.client.setVolumeDb(value);
    }

    setPosition(value)
    {
        this.client.setPlaybackPosition(value);
    }

    update(playerInfo)
    {
        Object.assign(this, playerInfo);

        clearInterval(this.positionUpdaterId);

        if (this.playbackState == PlaybackState.playing)
        {
            this.lastPositionUpdate = Date.now();
            this.positionUpdaterId = setInterval(this.updatePosition, 500);
        }

        this.emit('change');
    }

    updatePosition()
    {
        var now = Date.now();
        var delta = (now - this.lastPositionUpdate) / 1000;

        this.lastPositionUpdate = now;

        var position = this.activeItem.position;
        var duration = this.activeItem.duration;

        if (position >= 0 && duration >= 0)
        {
            this.activeItem.position = clamp(position + delta, 0, duration);
            this.emit('change');
        }
    }
}
