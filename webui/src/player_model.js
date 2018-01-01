import EventEmitter from 'wolfy87-eventemitter'
import debounce from 'lodash/debounce'
import clamp from 'lodash/clamp'
import { SwitchParam, PlaybackState, PlaybackOrder, LoopMode } from './api_client'

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
    },
    options: {
        order: PlaybackOrder.linear,
        loop: LoopMode.all,
    }
});

export default class PlayerModel extends EventEmitter
{
    constructor(client, dataSource)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;

        Object.assign(this, initialPlayerInfo);

        this.updatePosition = this.updatePosition.bind(this);
        this.defineEvent('change');

        this.setVolumeRemote = debounce(value => this.client.setVolumeDb(value), 50);
    }

    start()
    {
        this.dataSource.on('player', this.update.bind(this));
        this.dataSource.watch('player', {
            trcolumns: ['%artist% - %title%']
        });
    }

    play()
    {
        this.client.playCurrent();
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
        this.volume.isMuted = !this.volume.isMuted;
        this.client.setMuted(SwitchParam.toggle);
        this.emit('change');
    }

    setVolume(value)
    {
        this.volume.db = value;
        this.emit('change');
        this.setVolumeRemote(value);
    }

    setPosition(value)
    {
        this.client.setPlaybackPosition(value);
    }

    setPlaybackOrder(value)
    {
        this.client.setPlaybackOrder(value);
    }

    setLoopMode(value)
    {
        this.client.setLoopMode(value);
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
