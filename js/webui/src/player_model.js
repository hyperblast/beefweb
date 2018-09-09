import EventEmitter from 'wolfy87-eventemitter'
import debounce from 'lodash/debounce'
import clamp from 'lodash/clamp'
import Timer from './timer'
import { SwitchParam, PlaybackState } from 'beefweb-client'

const initialPlayerInfo = Object.freeze({
    info: {
        name: '',
        title: '',
        version: '0.0',
        pluginVersion: '0.0',
    },
    playbackState: PlaybackState.stopped,
    playbackMode: 0,
    playbackModes: ['Default'],
    volume: {
        type: 'db',
        min: 0.0,
        max: 0.0,
        value: 0.0,
        isMuted: false,
    },
    activeItem: {
        playlistId: '',
        playlistIndex: -1,
        index: -1,
        position: -1,
        duration: -1,
        columns: [],
    },
    activeItemId: '',
});

export default class PlayerModel extends EventEmitter
{
    constructor(client, dataSource)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;
        this.positionTimer = new Timer(this.updatePosition.bind(this), 500);

        Object.assign(this, initialPlayerInfo);

        this.defineEvent('change');
        this.defineEvent('trackSwitch');

        this.setVolumeRemote = debounce(value => this.client.setVolume(value), 80);
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
        const isMuted = !this.volume.isMuted;
        this.updateState('volume', { isMuted });
        this.client.setMuted(isMuted);
    }

    setVolume(value)
    {
        this.updateState('volume', { value });
        this.setVolumeRemote(value);
    }

    setPosition(value)
    {
        this.client.setPlaybackPosition(value);
    }

    setPlaybackMode(value)
    {
        this.client.setPlaybackMode(value);
    }

    update(playerInfo)
    {
        const wasPlaying = this.playbackState === PlaybackState.playing;

        Object.assign(this, playerInfo);

        if (this.playbackState === PlaybackState.playing)
            this.positionTimer.restart();
        else
            this.positionTimer.stop();

        this.emit('change');
        this.notifyTrackSwitch(wasPlaying);
    }

    updateState(key, value)
    {
        this[key] = Object.assign({}, this[key], value);
        this.emit('change');
    }

    updatePosition(delta)
    {
        const { position, duration } = this.activeItem;

        if (position < 0 || duration < 0)
            return;

        const newPosition = clamp(position + delta / 1000, 0, duration);

        this.updateState('activeItem', { position: newPosition });
    }

    notifyTrackSwitch(wasPlaying)
    {
        const previousItemId = this.activeItemId;
        const { playlistId, index } = this.activeItem;

        this.activeItemId = `${playlistId}:${index}`;

        if (wasPlaying &&
            this.playbackState === PlaybackState.playing &&
            this.activeItemId !== previousItemId)
        {
            this.emit('trackSwitch');
        }
    }
}
