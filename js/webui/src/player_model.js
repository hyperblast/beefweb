import EventEmitter from 'wolfy87-eventemitter'
import { debounce } from 'lodash'
import { clamp } from 'lodash'
import Timer from './timer.js'
import { PlaybackState } from 'beefweb-client'
import { defaultPlayerFeatures, getPlayerFeatures } from './player_features.js';

const initialPlayerInfo = Object.freeze({
    features: defaultPlayerFeatures,
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

/**
 * @class PlayerModel
 * @property {object} features
 * @property {object} info
 * @property {string} playbackState
 * @property {number} playbackMode
 * @property {object} volume
 * @property {object} activeItem
 * @property {string} activeItemId
 */
export default class PlayerModel extends EventEmitter
{
    constructor(client, dataSource, settingsModel)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;
        this.settingsModel = settingsModel;
        this.positionTimer = new Timer(this.updatePosition.bind(this), 500);
        this.featuresInitialized = false;

        Object.assign(this, initialPlayerInfo);

        this.defineEvent('change');
        this.defineEvent('trackSwitch');

        this.setVolumeRemote = debounce(value => this.client.setVolume(value), 80);
        this.reloadWithDelay = debounce(this.reload.bind(this), 1000);
    }

    start()
    {
        this.dataSource.on('player', this.update.bind(this));

        this.settingsModel.on('windowTitleExpressionChange', this.reloadWithDelay);
        this.settingsModel.on('playbackInfoExpressionChange', this.reloadWithDelay);

        this.reload();
    }

    play()
    {
        this.client.playCurrent();
    }

    playRandom()
    {
        this.client.playRandom();
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

    nextBy(expression)
    {
        this.client.next({ by: expression });
    }

    previous()
    {
        this.client.previous();
    }

    previousBy(expression)
    {
        this.client.previous({ by: expression });
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

        if (!this.featuresInitialized) {
            this.features = getPlayerFeatures(this.info.name);
            this.featuresInitialized = true;
        }

        if (this.playbackState === PlaybackState.playing)
            this.positionTimer.restart();
        else
            this.positionTimer.stop();

        this.emit('change');
        this.notifyTrackSwitch(wasPlaying);
    }

    reload()
    {
        this.dataSource.watch('player', {
            trcolumns: [
                this.settingsModel.windowTitleExpression,
                this.settingsModel.playbackInfoExpression
            ]
        });
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
